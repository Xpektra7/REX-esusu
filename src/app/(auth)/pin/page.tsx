"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
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
import { validatePin } from "@/lib/validations/auth";
import { useAuthStore } from "@/stores/auth-store";

function PinForm() {
  const router = useRouter();
  const [mode, setMode] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("pending_pin_mode") || "verify"
      : "verify",
  );

  const setPinSet = useAuthStore((s) => s.setPinSet);
  const incrementPinAttempt = useAuthStore((s) => s.incrementPinAttempt);
  const resetPinAttempts = useAuthStore((s) => s.resetPinAttempts);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const pinAttempts = useAuthStore((s) => s.pinAttempts);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const verifiedCurrentPin = useRef("");
  const [step, setStep] = useState<"current" | "enter" | "confirm">(
    mode === "change" ? "current" : "enter",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect on excessive PIN attempts (verify mode only)
  const prevAttempts = useRef(pinAttempts);
  if (mode === "verify" && pinAttempts >= 10 && prevAttempts.current < 10) {
    clearAuth();
    router.push("/signin");
  }
  prevAttempts.current = pinAttempts;

  const isLocked = mode === "verify" && pinAttempts >= 3;
  const lockMessage =
    pinAttempts >= 10
      ? "Too many failed attempts. You've been logged out."
      : pinAttempts >= 5
        ? "Account locked. Try again later."
        : pinAttempts >= 3
          ? "Too many wrong attempts. Please sign in again."
          : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "set") {
      // --- SET PIN ---
      if (step === "enter") {
        if (pin.length < 4) return;
        const pinError = validatePin(pin);
        if (pinError) {
          setError(pinError);
          return;
        }
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
        sessionStorage.removeItem("pending_pin_mode");
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to set PIN");
      } finally {
        setLoading(false);
      }
    } else if (mode === "change") {
      // --- CHANGE PIN ---
      if (step === "current") {
        if (currentPin.length < 4) return;
        setLoading(true);
        try {
          await api.auth.verifyPin(currentPin);
          verifiedCurrentPin.current = currentPin;
          setStep("enter");
          setCurrentPin("");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Wrong PIN");
          setCurrentPin("");
        } finally {
          setLoading(false);
        }
        return;
      }

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
        await api.auth.changePin({ currentPin: verifiedCurrentPin.current, newPin: pin });
        sessionStorage.removeItem("pending_pin_mode");
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to change PIN");
      } finally {
        setLoading(false);
      }
    } else {
      // --- VERIFY PIN ---
      if (isLocked) return;
      setLoading(true);
      try {
        await api.auth.verifyPin(pin);
        resetPinAttempts();
        sessionStorage.removeItem("pending_pin_mode");
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
      : mode === "change"
        ? step === "current"
          ? "Enter current PIN"
          : step === "enter"
            ? "Choose a new PIN"
            : "Confirm new PIN"
        : "Enter your PIN";

  const description =
    mode === "set"
      ? step === "enter"
        ? "Choose a 4-digit PIN to secure your account"
        : "Re-enter your PIN to confirm"
      : mode === "change"
        ? step === "current"
          ? "Enter your current PIN to continue"
          : step === "enter"
            ? "Choose a new 4-digit PIN"
            : "Re-enter your new PIN to confirm"
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
        <CardContent className="flex flex-col gap-4">
          <InputOTP
            maxLength={4}
            mask
            autoComplete="off"
            className="flex justify-center4"
            value={
              mode === "change" && step === "current"
                ? currentPin
                : mode === "set" && step === "confirm"
                  ? confirmPin
                  : pin
            }
            onChange={(val) => {
              if (mode === "change" && step === "current") {
                setCurrentPin(val);
              } else if (mode === "set" && step === "confirm") {
                setConfirmPin(val);
              } else {
                setPin(val);
              }
            }}
            disabled={isLocked}
          >
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-14 *:data-[slot=input-otp-slot]:w-21 *:data-[slot=input-otp-slot]:text-2xl">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {lockMessage && (
            <p className="text-sm text-destructive text-center font-medium">
              {lockMessage}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex-col mt-4 gap-2">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={
              loading ||
              isLocked ||
              (mode === "set" && step === "enter" && pin.length < 4) ||
              (mode === "change" && step === "current" && currentPin.length < 4)
            }
          >
            {loading
              ? "Please wait..."
              : mode === "set" && step === "enter"
                ? "Continue"
                : mode === "set" && step === "confirm"
                  ? "Set PIN"
                  : mode === "change" && step === "current"
                    ? "Continue"
                    : mode === "change" && step === "enter"
                      ? "Continue"
                      : mode === "change" && step === "confirm"
                        ? "Change PIN"
                        : "Unlock"}
          </Button>
          {mode === "verify" && pinAttempts >= 3 && pinAttempts < 10 && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/signin")}
            >
              Sign in again
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

/**
 * Wrapper for Suspense boundary.
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
