"use client";

import { Coins02Icon } from "hugeicons-react";
import { useState } from "react";
import { DebtBadge } from "@/components/circles/debt-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { formatNaira } from "@/lib/utils";

interface DebtItem {
  memberName: string;
  amountKobo: number;
  cycle: number;
  status: string;
  createdAt: string;
}

interface DebtHistoryListProps {
  debts: DebtItem[];
}

function DebtBreakdownDialog({
  debt,
  open,
  onOpenChange,
}: {
  debt: DebtItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const daysSince = Math.floor(
    (Date.now() - new Date(debt.createdAt).getTime()) / 86400000,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Debt Breakdown</DialogTitle>
          <DialogDescription>
            {debt.memberName} · Cycle #{debt.cycle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-heading text-lg font-bold">
              {formatNaira(debt.amountKobo)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <DebtBadge status={debt.status} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cycle</span>
            <span className="text-sm font-medium">#{debt.cycle}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Incurred</span>
            <span className="text-sm font-medium">{daysSince} days ago</span>
          </div>

          {debt.status === "active" && (
            <>
              <Separator />
              <Button className="w-full" size="lg">
                Pay Debt
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DebtHistoryList({ debts }: DebtHistoryListProps) {
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);

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
        <button
          type="button"
          key={`${debt.memberName}-${debt.cycle}`}
          onClick={() => setSelectedDebt(debt)}
          className="flex items-center justify-between rounded-xl bg-card px-4 py-3 text-left card-interactive w-full"
        >
          <div>
            <p className="text-sm font-medium">{debt.memberName}</p>
            <p className="text-xs text-muted-foreground">
              {formatNaira(debt.amountKobo)} · Cycle #{debt.cycle}
            </p>
          </div>
          <DebtBadge status={debt.status} />
        </button>
      ))}

      {selectedDebt && (
        <DebtBreakdownDialog
          debt={selectedDebt}
          open={selectedDebt !== null}
          onOpenChange={(open) => { if (!open) setSelectedDebt(null); }}
        />
      )}
    </div>
  );
}
