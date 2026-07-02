"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { withdrawSchema } from "@/lib/validations";
import { Loading01Icon } from "hugeicons-react";
import { toast } from "sonner";

const banks = [
  { code: "000", name: "GTBank" },
  { code: "001", name: "Access Bank" },
  { code: "002", name: "Wema Bank" },
  { code: "003", name: "FirstBank" },
  { code: "004", name: "Zenith Bank" },
  { code: "005", name: "UBA" },
  { code: "006", name: "Opay" },
  { code: "007", name: "Paga" },
] as const;

export default function WithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: {
      amount_kobo: number;
      bank_code: string;
      account_number: string;
    }) => api.wallet.withdraw(data),
    onSuccess: () => {
      toast.success("Withdrawal initiated!");
      router.push("/wallet");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Withdrawal failed");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const amountKobo = Math.round(parseFloat(amount) * 100);
    const parsed = withdrawSchema.safeParse({
      amount_kobo: amountKobo,
      bank_code: bankCode,
      account_number: accountNumber,
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

    mutation.mutate(parsed.data);
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Amount (₦)
          </label>
          <Input
            type="number"
            min={1}
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!errors.amount_kobo}
          />
          {errors.amount_kobo && (
            <p className="text-sm text-destructive">{errors.amount_kobo}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Bank
          </label>
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-invalid={!!errors.bank_code}
          >
            <option value="">Select bank</option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
          {errors.bank_code && (
            <p className="text-sm text-destructive">{errors.bank_code}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Account Number
          </label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!errors.account_number}
          />
          {errors.account_number && (
            <p className="text-sm text-destructive">
              {errors.account_number}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending && (
            <Loading01Icon className="size-4 animate-spin" />
          )}
          {mutation.isPending ? "Processing..." : "Withdraw"}
        </Button>
      </form>
    </div>
  );
}
