"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn, formatNaira } from "@/lib/utils";
import {
  PiggyBankIcon,
  Calendar01Icon,
  SavingsIcon,
  Wallet01Icon,
} from "hugeicons-react";
import Link from "next/link";
import type { CircleListItem as CircleData } from "@/types";

const iconSet = [
  { icon: PiggyBankIcon },
  { icon: Calendar01Icon },
  { icon: SavingsIcon },
  { icon: Wallet01Icon },
];

export { type CircleData };

export function CircleCard({ circle }: { circle: CircleData }) {
  const idx = circle.name.length % iconSet.length;
  const Icon = iconSet[idx].icon;
  const progress =
    circle.cycle_count > 0
      ? (circle.current_cycle / circle.cycle_count) * 100
      : 0;

  return (
    <Link
      href={`/circles/${circle.id}`}
      className="block transition-colors hover:opacity-80"
    >
      <Card className="py-4">
        <CardHeader className="px-4">
          <div className="flex items-start justify-between p-0!">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4.5" />
              </div>
              <div>
                <CardTitle>{circle.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {circle.type ?? "Rotating Savings Group"}
                </p>
              </div>
            </div>
            <Badge
              variant={circle.status === "active" ? "default" : "outline"}
            >
              {circle.status === "active" ? "Active" : "Inactive"}
            </Badge>
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
                {formatNaira(circle.contribution_amount)}
              </p>
            </div>
            {circle.member_position != null && circle.total_members != null && (
              <div className="text-right">
                <p className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                  Position
                </p>
                <p className="font-heading text-base font-bold">
                  {circle.member_position} / {circle.total_members}
                </p>
              </div>
            )}
          </div>

          <Progress value={progress} className="mt-4">
            <div className="flex w-full items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-semibold tracking-wider uppercase">
                Cycle {circle.current_cycle} of {circle.cycle_count}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
          </Progress>
        </CardContent>
      </Card>
    </Link>
  );
}
