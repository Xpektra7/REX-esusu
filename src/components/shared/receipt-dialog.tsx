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
import { formatNaira } from "@/lib/utils";
import type { TransferReceipt } from "@/types";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: TransferReceipt | null;
  loading?: boolean;
}

export function ReceiptDialog({
  open,
  onOpenChange,
  receipt,
  loading,
}: ReceiptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Transfer Receipt</DialogTitle>
          <DialogDescription>
            {receipt?.narration ?? "Transaction details"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading receipt...
          </div>
        ) : receipt ? (
          <div className="flex flex-col gap-3 py-2 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Amount
              </p>
              <p className="font-heading text-lg font-bold">
                {formatNaira(receipt.amountKobo)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Status
                </p>
                <p className="mt-0.5 font-medium capitalize">
                  {receipt.status}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Type
                </p>
                <p className="mt-0.5 font-medium capitalize">
                  {receipt.type.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            {receipt.circle && (
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Circle
                </p>
                <p className="mt-0.5 font-medium">
                  {receipt.circle.name} — Cycle {receipt.circle.cycleNumber}
                </p>
              </div>
            )}

            {receipt.reference && (
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Reference
                </p>
                <p className="mt-0.5 break-all font-mono text-xs">
                  {receipt.reference}
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Recipient
              </p>
              <p className="mt-0.5 font-medium">
                {receipt.recipient.accountName ??
                  receipt.recipient.name ??
                  "N/A"}
              </p>
              {receipt.recipient.accountNumber && (
                <p className="text-xs text-muted-foreground">
                  {receipt.recipient.accountNumber}
                  {receipt.recipient.bankCode
                    ? ` · ${receipt.recipient.bankCode}`
                    : ""}
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {new Date(receipt.createdAt).toLocaleString("en-NG")}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Receipt not available.
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
