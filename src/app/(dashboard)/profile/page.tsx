"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IdVerifiedIcon,
  Logout01Icon,
  Mail01Icon,
  Share08Icon,
  Shield01Icon,
  UserIcon,
} from "hugeicons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  bvnLast4: string;
  trustScore: number;
}

function SettingsRow({
  icon,
  label,
  variant,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "danger";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl card-interactive px-4 py-3 w-full text-left",
        variant === "danger" && "border-destructive/30",
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full",
          variant === "danger"
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          variant === "danger" && "text-destructive",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: res, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.users.me(),
  });

  const user = res?.data as UserProfile | undefined;

  const [editField, setEditField] = useState<"name" | "email" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = (field: "name" | "email") => {
    setEditField(field);
    setEditValue(field === "name" ? user?.name ?? "" : user?.email ?? "");
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editField || !editValue.trim()) return;
    setSaving(true);
    setEditError(null);
    try {
      await api.users.update(
        editField === "name" ? { name: editValue.trim() } : { email: editValue.trim() },
      );
      setEditField(null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      setEditError("Failed to update. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Profile" }]}
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-5 w-32 rounded" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <DiceBearAvatar name={user?.name ?? "User"} className="size-16" />
          <div className="text-center">
            <h1 className="text-lg font-bold">{user?.name ?? "User"}</h1>
            <p className="text-xs text-muted-foreground">{user?.phone}</p>
          </div>
        </div>
      )}

      {user && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IdVerifiedIcon className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                  KYC Status
                </p>
                <p className="text-sm font-medium">Verified</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                Trust Score
              </p>
              <p className="font-heading text-lg font-bold text-primary">
                {user.trustScore}
              </p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${user.trustScore}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            BVN verified · Last 4 digits: {user.bvnLast4}
          </p>
        </Card>
      )}

      <Separator />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          Account Settings
        </h2>
        <SettingsRow
          icon={<UserIcon className="size-4" />}
          label="Edit Name"
          onClick={() => openEdit("name")}
        />
        <SettingsRow
          icon={<Mail01Icon className="size-4" />}
          label="Edit Email"
          onClick={() => openEdit("email")}
        />
        <SettingsRow
          icon={<Shield01Icon className="size-4" />}
          label="Change PIN"
          onClick={() => router.push("/signup/pin")}
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider">More</h2>
        <SettingsRow
          icon={<Share08Icon className="size-4" />}
          label="Refer & Earn"
          onClick={() => router.push("/referrals")}
        />
        <button
          type="button"
          onClick={async () => {
            try {
              await api.auth.logout();
            } catch {
              /* ignore */
            }
            clearAuth();
            router.push("/signin");
          }}
          className={cn(
            "flex items-center gap-3 rounded-xl border border-destructive/30 px-4 py-3 transition-colors hover:bg-muted/50 w-full text-left",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Logout01Icon className="size-4" />
          </div>
          <span className="text-sm font-medium text-destructive">Log Out</span>
        </button>
      </div>

      <Dialog open={editField !== null} onOpenChange={(open) => { if (!open) setEditField(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              Edit {editField === "name" ? "Name" : "Email"}
            </DialogTitle>
            <DialogDescription>
              {editField === "name"
                ? "Update your display name."
                : "Change your email address."}
            </DialogDescription>
          </DialogHeader>

          <input
            type={editField === "email" ? "email" : "text"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={editField === "name" ? "Chioma Okafor" : "chioma@example.com"}
            className="w-full rounded-lg bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
            autoFocus
          />

          {editError && <p className="text-sm text-destructive">{editError}</p>}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setEditField(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !editValue.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
