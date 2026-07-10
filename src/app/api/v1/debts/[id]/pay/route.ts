import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  debts,
  membersCircles,
  virtualAccounts,
  walletTransactions,
} from "@/db/schema";
import {
  conflict,
  error,
  handleApiError,
  notFound,
  success,
} from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { payDebtSchema } from "@/lib/validations/debts";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const userId = auth.user.userId;
  const { id } = await params;

  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) return error("Invalid debt id", "01", 422);
  try {
    const raw = await req.text();
    let body: unknown = {};
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        return error("Invalid JSON body", "01", 400);
      }
    }

    const parsed = payDebtSchema.safeParse(body);
    if (!parsed.success) return error("Invalid request body", "01", 422);
    const requestedAmount = parsed.data.amount;

    const result = await db.transaction(async (tx) => {
      const [debt] = await tx
        .select()
        .from(debts)
        .where(eq(debts.id, id))
        .for("update");

      if (!debt) return { kind: "notFound" as const };

      const [membership] = await tx
        .select()
        .from(membersCircles)
        .where(
          and(
            eq(membersCircles.id, debt.debtorMemberId),
            eq(membersCircles.userId, userId),
          ),
        );

      if (!membership) return { kind: "notFound" as const };

      if (debt.status !== "active") {
        return {
          kind: "conflict" as const,
          message: "Debt is already cleared",
        };
      }

      const remaining = debt.amountKobo - debt.paidKobo;
      if (remaining <= 0) {
        return {
          kind: "conflict" as const,
          message: "Debt is already cleared",
        };
      }

      const payAmount = requestedAmount ?? remaining;

      if (payAmount <= 0) {
        return {
          kind: "error" as const,
          message: "Amount must be greater than zero",
        };
      }

      if (payAmount > remaining) {
        return {
          kind: "error" as const,
          message: "Amount exceeds remaining debt",
        };
      }

      const [wallet] = await tx
        .select()
        .from(virtualAccounts)
        .where(
          and(
            eq(virtualAccounts.userId, userId),
            eq(virtualAccounts.type, "personal"),
          ),
        )
        .for("update");

      if (!wallet || wallet.balanceKobo < payAmount) {
        return {
          kind: "error" as const,
          message: "Insufficient wallet balance",
        };
      }

      await tx
        .update(virtualAccounts)
        .set({ balanceKobo: wallet.balanceKobo - payAmount })
        .where(eq(virtualAccounts.id, wallet.id));

      const newPaidKobo = debt.paidKobo + payAmount;
      const isFullyPaid = newPaidKobo >= debt.amountKobo;

      const [updatedDebt] = await tx
        .update(debts)
        .set({
          paidKobo: newPaidKobo,
          status: isFullyPaid ? "cleared" : "active",
          clearedAt: isFullyPaid ? new Date() : null,
        })
        .where(eq(debts.id, id))
        .returning();

      await tx.insert(walletTransactions).values({
        userId,
        type: "debt_payment",
        amountKobo: payAmount,
        reference: `debt_${id}_${Date.now()}`,
        status: "success",
        metadata: { debtId: id },
      });

      return { kind: "success" as const, debt: updatedDebt };
    });

    if (result.kind === "notFound") return notFound("Debt not found");
    if (result.kind === "conflict") return conflict(result.message);
    if (result.kind === "error") return error(result.message);

    return success({ debt: result.debt });
  } catch (e) {
    return handleApiError(e);
  }
}
