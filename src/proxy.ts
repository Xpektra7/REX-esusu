import { type NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

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
  "/about",
  "/faq",
  "/contact",
  "/legal",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has("esusu-auth");

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

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !isAuthenticated) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signinUrl);
  }

  if (isAuthenticated && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublic && isAuthenticated && pathname.startsWith("/signin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|icon.*\\.svg|apple-icon.*\\.png).*)",
  ],
};
