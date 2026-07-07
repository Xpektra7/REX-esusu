"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft01Icon } from "hugeicons-react";
import Link from "next/link";
import { AutoPayToggle } from "@/components/settings/auto-pay-toggle";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { SecuritySection } from "@/components/settings/security-section";
import { AccountSection } from "@/components/settings/account-section";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { UserProfile, UserSettings } from "@/types";

export default function SettingsPage() {
  const { data: settingsRes, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.users.settings.get(),
  });

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.users.me(),
  });

  const settings = settingsRes?.data as UserSettings | undefined;
  const user = profileRes?.data as UserProfile | undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft01Icon className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {settingsLoading || profileLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <>
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
              Payment Preferences
            </h2>
            {settings ? <AutoPayToggle enabled={settings.autoPay} /> : <p className="text-sm text-muted-foreground">Coming soon</p>}
          </Card>

          <Separator />

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
              Notifications
            </h2>
            {settings ? <NotificationPreferences settings={settings} /> : <p className="text-sm text-muted-foreground">Coming soon</p>}
          </Card>

          <Separator />

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
              Security
            </h2>
            <SecuritySection />
          </Card>

          <Separator />

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
              Account
            </h2>
            {user && <AccountSection user={user} />}
          </Card>
        </>
      )}
    </div>
  );
}
