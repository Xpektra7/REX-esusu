"use client";

import { toPng } from "html-to-image";
import { useRef, useState } from "react";
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
  const receiptRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(receiptRef.current, { quality: 1 });
      const link = document.createElement("a");
      link.download = `receipt-${receipt?.reference ?? receipt?.receiptId ?? "unknown"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      /* html-to-image may fail on some environments */
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(receiptRef.current, { quality: 1 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File(
        [blob],
        `receipt-${receipt?.reference ?? "unknown"}.png`,
        { type: "image/png" },
      );
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Payment Receipt" });
      } else {
        // Fallback: download
        const link = document.createElement("a");
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    } catch {
      /* share cancelled or failed */
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div ref={receiptRef} className="rounded-xl bg-card p-1">
          <div className="rounded-lg border p-4">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
              <DialogDescription>
                {receipt?.narration ?? "Transaction receipt"}
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
                  {formatDateTime(receipt.createdAt)}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Receipt not available.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:flex-row">
          {receipt && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
                disabled={exporting}
              >
                {exporting ? "Preparing..." : "Download"}
              </Button>
              {typeof navigator !== "undefined" && !!navigator.share && (
                <Button
                  className="flex-1"
                  onClick={handleShare}
                  disabled={exporting}
                >
                  Share
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
