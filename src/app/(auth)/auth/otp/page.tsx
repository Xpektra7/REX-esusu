"use client";

import { Refresh01Icon } from "hugeicons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const email = searchParams.get("email") || "";
  const flow = searchParams.get("flow") || "login";
  const name =
    typeof window !== "undefined"
      ? sessionStorage.getItem("pending_name") || ""
      : "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const password =
    typeof window !== "undefined"
      ? sessionStorage.getItem("pending_password") || ""
      : "";

  useEffect(() => {
    if (!email) {
      router.replace("/auth");
    }
    const pendingOtp = sessionStorage.getItem("pending_otp");
    if (pendingOtp) {
      setOtp(pendingOtp);
      sessionStorage.removeItem("pending_otp");
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.verify({
        email,
        otp,
        password,
        ...(flow === "signup" ? { name } : {}),
      });

      const data = res.data as unknown as {
        token: string;
        refreshToken: string;
        user: { id: string; name: string; email: string };
        needsBvn: boolean;
        pinSet: boolean;
      };

      sessionStorage.removeItem("pending_password");
      sessionStorage.removeItem("pending_otp");

      setAuth({
        access_token: data.token,
        refresh_token: data.refreshToken,
        user: data.user,
        needs_bvn: data.needsBvn,
        pin_set: data.pinSet,
      });

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

  return (
    <Card className="w-fit">
      <CardHeader>
        <CardTitle>Verify your login</CardTitle>
        <CardDescription>
          Enter the verification code sent to{" "}
          <span className="font-medium">{email}</span>.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col gap-4">
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
                    const res = await api.auth.sendOtp(email);
                    if (res.data.otp) {
                      setOtp(res.data.otp);
                      sessionStorage.setItem("pending_otp", res.data.otp);
                    }
                  } catch {
                    /* silent */
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
              <InputOTPGroup className="flex-1 *:data-[slot=input-otp-slot]:flex-1 *:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator className="mx-3" />
              <InputOTPGroup className="flex-1 *:data-[slot=input-otp-slot]:flex-1 *:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:text-xl">
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
