"use client";

import { Coins02Icon } from "hugeicons-react";
import { DebtBadge } from "@/components/circles/debt-badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { formatNaira } from "@/lib/utils";

interface DebtItem {
  memberName: string;
  amountKobo: number;
  cycle: number;
  status: string;
}

interface DebtHistoryListProps {
  debts: DebtItem[];
}

export function DebtHistoryList({ debts }: DebtHistoryListProps) {
  if (debts.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Coins02Icon className="size-6" />
          </EmptyMedia>
          <EmptyDescription>No debts recorded.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {debts.map((debt) => (
        <div
          key={`${debt.memberName}-${debt.cycle}`}
          className="flex items-center justify-between rounded-xl bg-card px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium">{debt.memberName}</p>
            <p className="text-xs text-muted-foreground">
              {formatNaira(debt.amountKobo)} · Cycle #{debt.cycle}
            </p>
          </div>
          <DebtBadge status={debt.status} />
        </div>
      ))}
    </div>
  );
}
