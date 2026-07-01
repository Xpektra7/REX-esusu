"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
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
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

/**
 * PIN set / verify page.
 *
 * Two modes controlled by ?mode= query param:
 *
 *   mode=set (default for first-time)
 *     Step 1: enter a 4-digit PIN
 *     Step 2: confirm the same PIN
 *     On match → calls api.auth.setPin() → store pinSet = true → dashboard
 *
 *   mode=verify (for returning users)
 *     Shows a single 4-digit input.
 *     Calls api.auth.verifyPin().
 *     On success → dashboard.
 *     On failure → increments pinAttempts, clears input.
 */
function PinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "verify";

  const setPinSet = useAuthStore((s) => s.setPinSet);
  const incrementPinAttempt = useAuthStore((s) => s.incrementPinAttempt);
  const resetPinAttempts = useAuthStore((s) => s.resetPinAttempts);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "set") {
      // --- SET PIN ---
      if (step === "enter") {
        if (pin.length < 4) return;
        setStep("confirm");
        return;
      }

      // Confirm step — do the two values match?
      if (pin !== confirmPin) {
        setError("PINs do not match");
        setStep("enter");
        setPin("");
        setConfirmPin("");
        return;
      }

      setLoading(true);
      try {
        await api.auth.setPin(pin);
        setPinSet(true);
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to set PIN");
      } finally {
        setLoading(false);
      }
    } else {
      // --- VERIFY PIN ---
      setLoading(true);
      try {
        await api.auth.verifyPin(pin);
        resetPinAttempts();
        router.push("/dashboard");
      } catch (err) {
        incrementPinAttempt();
        setError(err instanceof Error ? err.message : "Wrong PIN");
        setPin("");
      } finally {
        setLoading(false);
      }
    }
  };

  // Dynamic title / description based on mode + step.
  const title =
    mode === "set"
      ? step === "enter"
        ? "Create your PIN"
        : "Confirm your PIN"
      : "Enter your PIN";

  const description =
    mode === "set"
      ? step === "enter"
        ? "Choose a 4-digit PIN to secure your account"
        : "Re-enter your PIN to confirm"
      : "Enter your 4-digit PIN to continue";

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <InputOTP
            maxLength={4}
            className="flex justify-center4"
            // Show confirmPin on confirm step, pin otherwise.
            value={mode === "set" && step === "confirm" ? confirmPin : pin}
            onChange={(val) => {
              if (mode === "set" && step === "confirm") {
                setConfirmPin(val);
              } else {
                setPin(val);
              }
            }}
          >
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-14 *:data-[slot=input-otp-slot]:w-21 *:data-[slot=input-otp-slot]:text-2xl">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>

        <CardFooter className="flex-col mt-4 gap-2">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={
              loading || (mode === "set" && step === "enter" && pin.length < 4)
            }
          >
            {loading
              ? "Please wait..."
              : mode === "set" && step === "enter"
                ? "Continue"
                : mode === "set" && step === "confirm"
                  ? "Set PIN"
                  : "Unlock"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/**
 * Wrapper required because `useSearchParams` must be inside `<Suspense>`.
 */
export default function PinPage() {
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
      <PinForm />
    </Suspense>
  );
}
