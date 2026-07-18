"use client";

import { Logout01Icon } from "hugeicons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { usePinSessionStore } from "@/stores/pin-session-store";

export function AppPinScreen({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, pinSet, clearAuth } = useAuthStore();
  const { appUnlocked, unlock } = usePinSessionStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  if (!isAuthenticated || !pinSet || appUnlocked) return children;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.verifyPin(pin);
      if (res.data?.verified) {
        useAuthStore.getState().resetPinAttempts();
        unlock();
        return;
      }
    } catch {
      // fall through to error
    } finally {
      setLoading(false);
    }

    const attempts = useAuthStore.getState().pinAttempts + 1;
    useAuthStore.getState().incrementPinAttempt();
    if (attempts >= 3) {
      setLocked(true);
      toast.error("Too many failed attempts. Sign in again.");
      return;
    }

    setError(`Incorrect PIN. ${3 - attempts} attempt(s) remaining.`);
    setPin("");
  };

  const handleSignOut = async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    router.push("/signin");
  };

  if (locked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-primary p-6">
        <img src="/icon-512.svg" alt="Esusu" className="size-12" />
        <Card className="w-fit max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>Too many attempts</CardTitle>
            <CardDescription>
              You&apos;ve been locked out. Sign in again to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} className="w-full" size="lg">
              <Logout01Icon className="size-4" />
              Sign In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-primary p-6">
      <img src="/icon-512.svg" alt="Esusu" className="size-12" />
      <Card className="w-fit max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Enter your PIN</CardTitle>
          <CardDescription>Verify your identity to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-4"
          >
            <InputOTP
              maxLength={4}
              mask
              autoComplete="off"
              value={pin}
              onChange={(val) => {
                setPin(val);
                setError(null);
              }}
            >
              <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-14 *:data-[slot=input-otp-slot]:w-16 *:data-[slot=input-otp-slot]:text-2xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || pin.length < 4}
            >
              {loading ? "Verifying..." : "Unlock"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
