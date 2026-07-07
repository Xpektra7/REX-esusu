"use client";

import { Logout01Icon, LockIcon } from "hugeicons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface ActionPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ActionPinDialog({
  open,
  onOpenChange,
  onSuccess,
}: ActionPinDialogProps) {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.verifyPin(pin);
      if (res.data?.verified) {
        useAuthStore.getState().resetPinAttempts();
        setPin("");
        onSuccess();
        return;
      }
    } catch {
      // fall through
    }

    const attempts = useAuthStore.getState().pinAttempts + 1;
    useAuthStore.getState().incrementPinAttempt();
    if (attempts >= 3) {
      setLocked(true);
      toast.error("Too many failed attempts. Signing out.");
      return;
    }

    setError(`Incorrect PIN. ${3 - attempts} attempt(s) remaining.`);
    setPin("");
    setLoading(false);
  };

  const handleLockedSignOut = async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    router.push("/signin");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && locked) {
      handleLockedSignOut();
      return;
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm w-fit">
        {locked ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <LockIcon className="size-5 text-destructive" />
            </div>
            <DialogHeader>
              <DialogTitle>Too many attempts</DialogTitle>
              <DialogDescription>
                You&apos;ve been locked out. Sign in again to continue.
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={handleLockedSignOut}
              variant="destructive"
              className="w-full"
            >
              <Logout01Icon className="size-4" />
              Sign In Again
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-fit flex flex-col items-center gap-4 py-4"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <LockIcon className="size-5 text-primary" />
            </div>

            <DialogHeader className="text-center">
              <DialogTitle>Enter your PIN</DialogTitle>
              <DialogDescription>
                Confirm your identity to proceed
              </DialogDescription>
            </DialogHeader>

            <InputOTP
              maxLength={4}
              value={pin}
              onChange={(val) => {
                setPin(val);
                setError(null);
              }}
              className="flex justify-center"
            >
              <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-14 *:data-[slot=input-otp-slot]:text-2xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex w-full gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPin("");
                  setError(null);
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || pin.length < 4}
              >
                {loading ? "Verifying..." : "Confirm"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
