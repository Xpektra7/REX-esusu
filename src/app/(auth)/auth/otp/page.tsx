"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Refresh01Icon } from "hugeicons-react";

/**
 * OTP verification form.
 *
 * Reads phone, flow, name, email from query params (set by /auth).
 * On submit, calls verify() with OTP + password.
 * If signup, also sends name + email.
 * Mock mode accepts any OTP (>= 6 chars) and any password (>= 8).
 *
 * On success:
 *   - needsBvn  → redirect to /auth/kyc
 *   - !pinSet   → redirect to /auth/pin?mode=set
 *   - otherwise → dashboard
 */
function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Query-param values from the /auth page.
  const phone = searchParams.get("phone") || "";
  const flow = searchParams.get("flow") || "login";
  const name = searchParams.get("name") || "";
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password was stored in sessionStorage by the /auth page (not in URL).
  const password =
    typeof window !== "undefined"
      ? sessionStorage.getItem("pending_password") || ""
      : "";

  // If someone navigates here directly without a phone, kick them back.
  useEffect(() => {
    if (!phone) {
      router.replace("/auth");
    }
  }, [phone, router]);

  if (!phone) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Verify OTP + password. Mock accepts any values.
      const res = await api.auth.verify({
        phone,
        otp,
        password,
        ...(flow === "signup" ? { name, email } : {}),
      });

      // Cast the response into the shape the store expects.
      const data = res.data as unknown as {
        token: string;
        refreshToken: string;
        user: { id: string; phone: string; name: string; email: string };
        needsBvn: boolean;
        pinSet: boolean;
      };

      // Clean up password from sessionStorage.
      sessionStorage.removeItem("pending_password");

      // Persist auth state (tokens + user + onboarding flags).
      setAuth({
        access_token: data.token,
        refresh_token: data.refreshToken,
        user: data.user,
        needs_bvn: data.needsBvn,
        pin_set: data.pinSet,
      });

      // Decide where to send the user next.
      if (data.needsBvn) {
        router.push("/auth/kyc");
      } else if (!data.pinSet) {
        router.push("/auth/pin?mode=set");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your login</CardTitle>
        <CardDescription>
          Enter the verification code sent to{" "}
          <span className="font-medium">{email || phone}</span>.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 mb-4">
          {/* OTP input — 6 digits, split 3+3 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="otp" className="mb-1 block text-sm font-medium">
                Verification code
              </label>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={async () => {
                  try {
                    await api.auth.sendOtp(phone);
                  } catch {
                    /* silent — mock always "succeeds" */
                  }
                }}
              >
                <Refresh01Icon className="mr-1 size-3" />
                Resend
              </Button>
            </div>

            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              required
              containerClassName="w-full"
            >
              <InputOTPGroup className="flex-1 *:data-[slot=input-otp-slot]:flex-1 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator className="mx-3" />
              <InputOTPGroup className="flex-1 *:data-[slot=input-otp-slot]:flex-1 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || otp.length < 6}
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/**
 * Wrapper required by Next.js — `useSearchParams` must be inside a
 * `<Suspense>` boundary or the build will fail.
 */
export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <OtpForm />
    </Suspense>
  );
}
