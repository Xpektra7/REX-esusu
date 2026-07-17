import { type NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { requirePageAuth } from "@/lib/middleware";

const apiLimiter = rateLimit({ windowMs: 60_000, maxRequests: 300 });
const authLimiter = rateLimit({ windowMs: 60_000, maxRequests: 60 });

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

const PROTECTED_ROUTES = [
  "/dashboard",
  "/circles",
  "/wallet",
  "/profile",
  "/notifications",
  "/referrals",
  "/settings",
];

const PUBLIC_ROUTES = [
  "/",
  "/signin",
  "/signup",
  "/auth",
  "/forgot-password",
  "/about",
  "/faq",
  "/contact",
  "/legal",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Rate limiting for API routes (M-01). Auth routes get a tighter limit to
  // blunt brute-force / OTP abuse.
  if (pathname.startsWith("/api/v1/auth/")) {
    const result = authLimiter.check(`auth:${clientIp(request)}`);
    if (!result.allowed) {
      return NextResponse.json(
        { code: "29", description: "Too many requests. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(result.resetIn / 1000)) },
        },
      );
    }
  } else if (pathname.startsWith("/api/")) {
    const result = apiLimiter.check(`api:${clientIp(request)}`);
    if (!result.allowed) {
      return NextResponse.json(
        { code: "29", description: "Too many requests. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(result.resetIn / 1000)) },
        },
      );
    }
  }

  // JWT-based auth via HttpOnly cookie (CVE-2025-29927: proxy is a lightweight
  // routing layer — auth enforcement also happens in route handlers.)
  const authUser = requirePageAuth(request);

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !authUser) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signinUrl);
  }

  if (authUser && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (authUser && isPublic && pathname.startsWith("/signin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|icon.*\\.svg|apple-icon.*\\.png).*)",
  ],
};
