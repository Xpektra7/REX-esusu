"use client";

import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export function JoinByCodeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.circles.joinByCode(code.trim()),
    onSuccess: (res) => {
      toast.success("You've joined the circle!");
      onOpenChange(false);
      setCode("");
      router.push(`/circles/${res.data.circleId}`);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to join circle");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Enter an invite code");
      return;
    }
    setError("");
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a circle</DialogTitle>
          <DialogDescription>
            Enter the invite code shared by the circle admin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="inviteCode" className="text-sm font-medium">
              Invite code
            </label>
            <Input
              id="inviteCode"
              placeholder="e.g. ESUSU-XYZ"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              className="tracking-widest uppercase"
              aria-invalid={!!error}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !code.trim()}>
              {mutation.isPending ? "Joining…" : "Join circle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
