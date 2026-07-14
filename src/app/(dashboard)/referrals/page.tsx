"use client";

import { useQuery } from "@tanstack/react-query";
import { Copy01Icon } from "hugeicons-react";
import { toast } from "sonner";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface ReferralData {
  code: string;
  referred: Array<{
    name: string;
    status: string;
    bonusKobo: number | null;
    joinedAt: string;
  }>;
}

export default function ReferralsPage() {
  const { data: res, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: () => api.referrals.list(),
  });

  const referral = res?.data as ReferralData | undefined;

  function handleCopy() {
    if (!referral) return;
    const link = `esusu.app/invite/${referral.code}`;
    navigator.clipboard.writeText(link);
    toast.success(`Referral link copied: ${link}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Referrals" }]}
      />

      <div>
        <h1 className="text-xl font-bold">Refer & Earn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite friends and earn trust score boosts.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : referral ? (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Your Referral Code
              </p>
              <p className="mt-1 text-foreground font-heading text-2xl font-bold tracking-wider">
                {referral.code}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="symbol-container bg-primary/10 text-primary"
              aria-label="Copy referral code"
            >
              <Copy01Icon className="symbol-width" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Share this code with friends. When they join and complete a cycle,
            you earn a trust score boost.
          </p>
        </Card>
      ) : null}

      <Separator />

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
          Referred Users
        </h2>
        {referral?.referred && referral.referred.length > 0 ? (
          <div className="flex flex-col gap-2">
            {referral.referred.map((r, i) => (
              <div
                key={r.name || i}
                className="flex items-center justify-between rounded-xl bg-card  px-4 py-3"
              >
                <p className="text-sm font-medium">{r.name}</p>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <img
                  src="/illustrations/referral.svg"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-32 object-contain"
                />
              </EmptyMedia>
              <EmptyDescription>
                No referrals yet. Share your code to start earning.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
