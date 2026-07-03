"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loading01Icon } from "hugeicons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { withdrawSchema } from "@/lib/validations";

export default function WithdrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: banksRes, isLoading: banksLoading } = useQuery({
    queryKey: ["bank-codes"],
    queryFn: () => api.bankCodes(),
  });
  const banks = banksRes?.data?.banks ?? [];

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const amountKobo = Math.round(parseFloat(amount) * 100);
    const parsed = withdrawSchema.safeParse({
      amountKobo: amountKobo,
      bankCode: bankCode,
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
          <label
            htmlFor="bankCode"
            className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
          >
            Bank
          </label>
          {banksLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={!!errors.bankCode}
            >
              <option value="">Select bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          )}
          {errors.bankCode && (
            <p className="text-sm text-destructive">{errors.bankCode}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="accountNumber"
            className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
          >
            Account Number
          </label>
          <Input
            id="accountNumber"
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, ""))
            }
            aria-invalid={!!errors.accountNumber}
          />
          {errors.accountNumber && (
            <p className="text-sm text-destructive">{errors.accountNumber}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loading01Icon className="size-4 animate-spin" />
          )}
          {mutation.isPending ? "Processing..." : "Withdraw"}
        </Button>
      </form>
    </div>
  );
}
