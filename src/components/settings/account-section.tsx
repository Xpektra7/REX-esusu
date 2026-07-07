"use client";

import { AlertCircleIcon, Mail01Icon } from "hugeicons-react";
import { useState } from "react";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";

interface AccountSectionProps {
  user: UserProfile;
}

export function AccountSection({ user }: AccountSectionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail01Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm font-medium">{user.email}</p>
        </div>
      </div>

      <Separator />

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className={cn(
          "flex items-center justify-between rounded-xl card-interactive px-4 py-3 w-full text-left",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircleIcon className="size-4" />
          </div>
          <span className="text-sm font-medium text-destructive">
            Delete Account
          </span>
        </div>
        <span className="text-muted-foreground">&rsaquo;</span>
      </button>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
