"use client";

import { DebtBadge } from "@/components/circles/debt-badge";
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
      <p className="py-4 text-center text-sm text-muted-foreground">
        No debts recorded.
      </p>
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
