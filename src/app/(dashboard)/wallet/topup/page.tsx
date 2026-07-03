"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy01Icon, Loading01Icon } from "hugeicons-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/utils";

export default function TopUpPage() {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState<string | null>(null);

  const { data: walletRes } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.wallet.get(),
  });

  const wallet = walletRes?.data as
    | {
        balanceKobo: number;
        virtualAccount: {
          accountNumber: string;
          accountName: string;
          bankCode: string;
        };
      }
    | undefined;

  const mutation = useMutation({
    mutationFn: (amountKobo: number) =>
      api.wallet.topup({ amountKobo }),
    onSuccess: (res) => {
      const data = res.data as {
        reference: string;
        virtualAccount: {
          accountNumber: string;
          accountName: string;
          bankCode: string;
        };
        amountKobo: number;
        instructions: string;
      };
      setReference(data.reference);
      toast.success("Payment reference generated");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to generate payment reference");
    },
  });

  const amountKobo = Math.round(parseFloat(amount || "0") * 100);
  const isValid = amountKobo >= 10000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    mutation.mutate(amountKobo);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Wallet", href: "/wallet" },
          { label: "Top Up" },
        ]}
      />

      <div>
        <h1 className="text-xl font-bold">Top Up Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add money to your wallet to contribute to circles.
        </p>
      </div>

      {!reference ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="topupAmount"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Amount (₦)
            </label>
            <Input
              id="topupAmount"
              type="number"
              min={100}
              step="100"
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum: ₦100
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending && (
              <Loading01Icon className="size-4 animate-spin" />
            )}
            {mutation.isPending ? "Generating..." : "Generate Payment Reference"}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4 border-primary/30 bg-primary/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Transfer this exact amount
            </p>
            <p className="font-heading text-3xl font-bold text-primary">
              {formatNaira(amountKobo)}
            </p>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <h3 className="text-sm font-bold">Bank Transfer Details</h3>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="text-sm font-medium">
                    {wallet?.virtualAccount.accountName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      wallet?.virtualAccount.accountName ?? "",
                    )
                  }
                  className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
                >
                  <Copy01Icon className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="text-sm font-medium tracking-widest">
                    {wallet?.virtualAccount.accountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      wallet?.virtualAccount.accountNumber ?? "",
                    )
                  }
                  className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
                >
                  <Copy01Icon className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="text-sm font-medium">
                    {wallet?.virtualAccount.bankCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      wallet?.virtualAccount.bankCode ?? "",
                    )
                  }
                  className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
                >
                  <Copy01Icon className="size-4" />
                </button>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 bg-muted/30 p-5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                1
              </span>
              Transfer exactly{" "}
              <span className="font-medium text-foreground">
                {formatNaira(amountKobo)}
              </span>{" "}
              to the account above
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                2
              </span>
              Use any Nigerian bank app (Wema, GTBank, Access, etc.)
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                3
              </span>
              Your wallet will be credited automatically once confirmed
            </p>
          </Card>

          <Separator />

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setReference(null)}
          >
            Top Up Again
          </Button>
        </div>
      )}
    </div>
  );
}
