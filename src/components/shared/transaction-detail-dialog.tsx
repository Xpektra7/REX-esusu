"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNaira, formatDateTime } from "@/lib/utils";

interface TransactionDetail {
  id: string;
  amountKobo: number;
  reference: string;
  status: string;
  description?: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tx: TransactionDetail | null;
}

export function TransactionDetailDialog({
  open,
  onOpenChange,
  tx,
}: TransactionDetailDialogProps) {
  const senderName = tx?.metadata?.senderName as string | undefined | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>{tx?.description}</DialogDescription>
        </DialogHeader>

        {tx ? (
          <div className="flex flex-col gap-3 py-2 text-sm">
            {senderName && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  From
                </p>
                <p className="font-heading text-lg font-bold">{senderName}</p>
              </div>
            )}

            <div className="rounded-lg bg-muted p-3">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Amount
              </p>
              <p className="font-heading text-lg font-bold">
                {formatNaira(tx.amountKobo)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Status
                </p>
                <p className="mt-0.5 font-medium capitalize">{tx.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Description
                </p>
                <p className="mt-0.5 font-medium">{tx.description}</p>
              </div>
            </div>

            {tx.reference && (
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Reference
                </p>
                <p className="mt-0.5 break-all font-mono text-xs">
                  {tx.reference}
                </p>
              </div>
            )}

            {tx.metadata && Object.keys(tx.metadata).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Extra details
                </p>
                <div className="mt-0.5 space-y-1">
                  {Object.entries(tx.metadata).map(([key, val]) => (
                    <p key={key} className="text-xs text-muted-foreground">
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}:
                      </span>{" "}
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val ?? "")}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {formatDateTime(tx.createdAt)}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Transaction not found.
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
