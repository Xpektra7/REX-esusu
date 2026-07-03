"use client";
export const dynamic = "force-dynamic";

import { IdVerifiedIcon, Shield01Icon } from "hugeicons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

/**
 * BVN KYC step.
 *
 * 3 steps:
 *   1. input    — user types their 11-digit BVN
 *   2. verifying — calls api.auth.verifyBvn() server-side
 *   3. confirm   — shows the returned name and asks "Is this you?"
 *
 * On confirm → marks BVN as verified in the store, redirects to /auth/pin?mode=set.
 */
export default function KycPage() {
  const router = useRouter();
  const { accessToken, setBvnVerified, needsBvn, user } = useAuthStore();

  const [bvn, setBvn] = useState("");
  const [step, setStep] = useState<"input" | "verifying" | "confirm">("input");
  const [verifiedName, setVerifiedName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Guard: if not authenticated send to /auth.
  // If BVN is already done, skip ahead to PIN setup instead.
  useEffect(() => {
    if (!accessToken) {
      router.replace("/auth");
    } else if (!needsBvn) {
      router.replace("/auth/pin?mode=set");
    }
  }, [accessToken, needsBvn, router]);

  if (!accessToken || !needsBvn) {
    return null;
  }

  const handleVerify = async () => {
    setError(null);
    setStep("verifying");

    try {
      const res = await api.auth.verifyBvn(bvn);
      const data = res.data as { verified: boolean; name: string; dob: string };
      const returnedName = data.name;

      if (returnedName.toLowerCase() !== (user?.name || "").toLowerCase()) {
        setError("BVN name does not match your account name");
        setStep("input");
        return;
      }

      setVerifiedName(returnedName);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "BVN verification failed");
      setStep("input");
    }
  };

  const handleConfirm = () => {
    setBvnVerified();
    router.push("/auth/pin?mode=set");
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your identity</CardTitle>
        <CardDescription>
          {step === "input" && "Enter your BVN to continue."}
          {step === "verifying" && "Verifying with NIBSS..."}
          {step === "confirm" && "Confirm your details."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Step 1 — BVN input */}
        {step === "input" && (
          <div className="space-y-4">
            <div className="space-y-4">
              <label htmlFor="bvn" className="block text-sm font-medium">
                Bank Verification Number (BVN)
              </label>
              <input
                id="bvn"
                type="password"
                inputMode="numeric"
                maxLength={11}
                placeholder="•••••••••••"
                value={bvn}
                onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Your BVN is encrypted and never shared. Only last 4 digits are
                stored.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {/* Step 2 — Verifying spinner */}
        {step === "verifying" && (
          <div className="flex flex-col items-center py-8">
            <Shield01Icon className="size-10 animate-pulse text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Retrieving your details...
            </p>
          </div>
        )}

        {/* Step 3 — Name confirmation */}
        {step === "confirm" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <IdVerifiedIcon className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">{verifiedName}</p>
                <p className="text-sm text-muted-foreground">Is this you?</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {step === "input" && (
          <Button
            type="button"
            className="w-full"
            disabled={bvn.length < 11}
            onClick={handleVerify}
          >
            Verify BVN
          </Button>
        )}

        {step === "confirm" && (
          <div className="flex w-full flex-col gap-3">
            <Button type="button" className="w-full" onClick={handleConfirm}>
              Yes, that&apos;s me
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setStep("input")}
            >
              No, try again
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
