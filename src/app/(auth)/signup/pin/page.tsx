"use client";

import { useRouter } from "next/navigation";
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
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/lib/api";
import { validatePin } from "@/lib/validations/auth";
import { useAuthStore } from "@/stores/auth-store";

export default function SetPinPage() {
  const router = useRouter();
  const setPinSet = useAuthStore((s) => s.setPinSet);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === "enter") {
      const pinError = validatePin(pin);
      if (pin.length < 4) return;
      if (pinError) {
        setError(pinError);
        return;
      }
      setStep("confirm");
      return;
    }

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
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {step === "enter" ? "Create your PIN" : "Confirm your PIN"}
        </CardTitle>
        <CardDescription>
          {step === "enter"
            ? "Choose a 4-digit PIN to secure your account"
            : "Re-enter your PIN to confirm"}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <InputOTP
            maxLength={4}
            className="flex justify-center"
            value={step === "confirm" ? confirmPin : pin}
            onChange={(val) => {
              if (step === "confirm") {
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
            disabled={loading || (step === "enter" && pin.length < 4)}
          >
            {loading
              ? "Please wait..."
              : step === "enter"
                ? "Continue"
                : "Set PIN"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
