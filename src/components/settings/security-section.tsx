"use client";

import { Shield01Icon } from "hugeicons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionPinDialog } from "@/components/shared/action-pin-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function SecuritySection() {
  const router = useRouter();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setPinDialogOpen(true);
  };

  const doChangePassword = async () => {
    setError(null);
    if (newPassword !== confirmPassword || newPassword.length < 8) return;
    setLoading(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem("pending_pin_mode", "change");
          router.push("/auth/pin");
        }}
        className={cn(
          "flex items-center justify-between rounded-xl card-interactive px-4 py-3 w-full text-left",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield01Icon className="size-4" />
          </div>
          <span className="text-sm font-medium">Change PIN</span>
        </div>
        <span className="text-muted-foreground">&rsaquo;</span>
      </button>

      <button
        type="button"
        onClick={() => setPasswordOpen(true)}
        className={cn(
          "flex items-center justify-between rounded-xl card-interactive px-4 py-3 w-full text-left",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield01Icon className="size-4" />
          </div>
          <span className="text-sm font-medium">Change Password</span>
        </div>
        <span className="text-muted-foreground">&rsaquo;</span>
      </button>

      <Dialog open={passwordOpen} onOpenChange={(open) => {
        if (!open) { setPasswordOpen(false); setError(null); }
      }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => { setPasswordOpen(false); setError(null); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              {loading ? "Saving..." : "Change"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ActionPinDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        onSuccess={doChangePassword}
      />
    </div>
  );
}
