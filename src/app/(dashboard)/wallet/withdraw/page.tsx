"use client";

import { useMutation } from "@tanstack/react-query";
import { BankIcon, Loading01Icon } from "hugeicons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ActionPinDialog } from "@/components/shared/action-pin-dialog";
import { BankSearchInput } from "@/components/shared/bank-search-input";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { withdrawSchema } from "@/lib/validations";

export default function WithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState<{
    bankCode: string;
    bankName: string;
    accountName: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: {
      amountKobo: number;
      bankCode: string;
      accountNumber: string;
    }) => api.wallet.withdraw(data),
    onSuccess: () => {
      toast.success("Withdrawal initiated!");
      router.push("/wallet");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Withdrawal failed");
    },
  });

  function attemptSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!selectedBank) {
      setErrors({ bankCode: "Please select a bank" });
      return;
    }

    const amountKobo = Math.round(parseFloat(amount) * 100);
    const parsed = withdrawSchema.safeParse({
      amountKobo: amountKobo,
      bankCode: selectedBank.bankCode,
      accountNumber: accountNumber,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setPinDialogOpen(true);
  }

  function doWithdraw() {
    if (!selectedBank) return;
    const amountKobo = Math.round(parseFloat(amount) * 100);
    mutation.mutate({
      amountKobo,
      bankCode: selectedBank.bankCode,
      accountNumber,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Wallet", href: "/wallet" },
          { label: "Withdraw" },
        ]}
      />

      <div>
        <h1 className="text-xl font-bold">Withdraw</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transfer your wallet balance to your bank account.
        </p>
      </div>

      <form onSubmit={attemptSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="withdrawAmount"
            className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
          >
            Amount (₦)
          </label>
          <Input
            id="withdrawAmount"
            type="number"
            min={1}
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!errors.amountKobo}
          />
          {errors.amountKobo && (
            <p className="text-sm text-destructive">{errors.amountKobo}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">

          <BankSearchInput
            value={accountNumber}
            onChange={setAccountNumber}
            onSelect={(match) => {
              setSelectedBank(match);
              setErrors((prev) => {
                const next = { ...prev };
                delete next.bankCode;
                delete next.accountNumber;
                return next;
              });
            }}
            selected={selectedBank}
            error={errors.bankCode || errors.accountNumber}
          />
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loading01Icon className="size-4 animate-spin" />
          )}
          {mutation.isPending ? "Processing..." : "Withdraw"}
        </Button>
      </form>

      <ActionPinDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        onSuccess={doWithdraw}
      />
    </div>
  );
}
