"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setError(null);
    if (confirm !== "DELETE") {
      setError('Type "DELETE" to confirm');
      return;
    }
    if (!password) {
      setError("Enter your password");
      return;
    }
    setLoading(true);
    try {
      await api.users.deleteAccount(password);
      clearAuth();
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            This action is irreversible. All your data, circles, and contributions will be permanently removed.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder='Type "DELETE" to confirm'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          <input
            type="password"
            placeholder="Current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirm !== "DELETE" || !password}
          >
            {loading ? "Deleting..." : "Delete Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
