"use client";

import {
  Calendar01Icon,
  PiggyBankIcon,
  SavingsIcon,
  Wallet01Icon,
} from "hugeicons-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatNaira } from "@/lib/utils";
import type { CircleListItem as CircleData } from "@/types";

const iconSet = [
  { icon: PiggyBankIcon },
  { icon: Calendar01Icon },
  { icon: SavingsIcon },
  { icon: Wallet01Icon },
];

export type { CircleData };

export function CircleCard({ circle }: { circle: CircleData }) {
  const idx = circle.name.length % iconSet.length;
  const Icon = iconSet[idx].icon;
  const progress =
    circle.cycleCount != null && circle.cycleCount > 0
      ? (circle.currentCycle / circle.cycleCount) * 100
      : 50;

  return (
    <Link
      href={`/circles/${circle.id}`}
      className="block transition-colors hover:opacity-80"
    >
      <Card className="py-4">
        <CardHeader className="px-4">
          <div className="flex items-start justify-between p-0!">
            <div className="flex items-center gap-3">
              <div className="symbol-container bg-primary/10 text-primary">
                <Icon className="symbol-width" />
              </div>
              <div>
                <CardTitle>{circle.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {circle.type ?? "Rotating Savings Group"}
                </p>
              </div>
            </div>
            <Badge variant={circle.status === "active" ? "default" : "outline"}>
              {circle.status === "active" ? "Active" : "Inactive"}
            </Badge>
            {circle.debtAmountKobo ? (
              <Badge variant="destructive">
                {formatNaira(circle.debtAmountKobo)} debt
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <Separator />

        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                Contribution
              </p>
              <p className="font-heading text-base font-bold">
                {formatNaira(circle.contributionAmount)}
              </p>
            </div>
            {circle.memberPosition != null && circle.totalMembers != null && (
              <div className="text-right">
                <p className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                  Position
                </p>
                <p className="font-heading text-base font-bold">
                  {circle.memberPosition} / {circle.totalMembers}
                </p>
              </div>
            )}
          </div>

          <Progress value={progress} className="mt-4">
            <div className="flex w-full items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-semibold tracking-wider uppercase">
                Cycle {circle.currentCycle}{circle.cycleCount !== null ? ` of ${circle.cycleCount}` : " (Continuous)"}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
          </Progress>
        </CardContent>
      </Card>
    </Link>
  );
}
