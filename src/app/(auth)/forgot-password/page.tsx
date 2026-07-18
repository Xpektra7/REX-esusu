"use client";

import { Refresh01Icon } from "hugeicons-react";
import Link from "next/link";
import { useState } from "react";
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

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Enter your email address");
      return;
    }

    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch {
      setError("Failed to send reset code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("Enter the full reset code");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword({ email, otp, newPassword });
      window.location.href = "/signin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "email") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            Enter the email address linked to your Esusu account and we'll send
            you a reset code.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSendOtp}>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="chioma@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {sent && (
              <p className="text-sm text-primary">
                If an account exists for this email, a reset code has been sent.
              </p>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button
              type="submit"
              size="lg"
              className="w-full py-4 text-base"
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : sent
                  ? "Resend code"
                  : "Send reset code"}
            </Button>

            {sent && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep("reset")}
              >
                I have a reset code
              </Button>
            )}

            <Link
              href="/signin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to login
            </Link>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Enter reset code</CardTitle>
        <CardDescription>
          Enter the code sent to <span className="font-medium">{email}</span>,
          then choose a new password.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleReset}>
        <CardContent className="flex flex-col gap-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="reset-otp" className="block text-sm font-medium">
                Reset code
              </label>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={async () => {
                  try {
                    setSent(false);
                    await api.auth.forgotPassword(email);
                    setSent(true);
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

          <div>
            <label
              htmlFor="new-password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
              required
              minLength={8}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl bg-background px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            className="w-full py-4 text-base"
            disabled={loading || otp.length !== 6}
          >
            {loading ? "Resetting..." : "Reset password"}
          </Button>

          <button
            type="button"
            onClick={() => setStep("email")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Change email
          </button>
        </CardFooter>
      </form>
    </Card>
  );
}
