import { desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { walletTransactions } from "@/db/schema";
import { handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

type ActivityItem = {
  type: string;
  description: string;
  amountKobo?: number;
  createdAt: string;
};

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const userId = auth.user.userId;

  try {
    const walletTx = await db
      .select({
        type: sql<string>`'wallet_${walletTransactions.type}'`,
        description: sql<string>`CASE WHEN ${walletTransactions.type} = 'topup' THEN concat('Topped up wallet with ₦', (${walletTransactions.amountKobo} / 100)::text) WHEN ${walletTransactions.type} = 'withdrawal' THEN concat('Withdrew ₦', (${walletTransactions.amountKobo} / 100)::text, ' from wallet') WHEN ${walletTransactions.type} = 'contribution' THEN concat('Contributed ₦', (${walletTransactions.amountKobo} / 100)::text, ' to a circle') WHEN ${walletTransactions.type} = 'payout' THEN concat('Received payout of ₦', (${walletTransactions.amountKobo} / 100)::text) ELSE 'Wallet transaction' END`,
        amountKobo: walletTransactions.amountKobo,
        createdAt: walletTransactions.createdAt,
      })
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(50);

    const memberContributionView = sql`
      SELECT c2.type, c2.description, c2.amount_kobo, c2.created_at FROM (
        SELECT
          'contribution' as type,
          concat('Contributed ₦', (ct.amount_kobo / 100)::text) as description,
          ct.amount_kobo,
          ct.created_at
        FROM contributions ct
        JOIN members_circles mc ON mc.id = ct.member_circle_id
        WHERE mc.user_id = ${userId}
        UNION ALL
        SELECT
          'cycle_close' as type,
          concat('Cycle #', cy.cycle_number, ' closed') as description,
          NULL::int as amount_kobo,
          cy.closed_at as created_at
        FROM cycles cy
        JOIN members_circles mc ON mc.circle_id = cy.circle_id
        WHERE mc.user_id = ${userId} AND cy.closed_at IS NOT NULL
        UNION ALL
        SELECT
          'debt' as type,
          concat('Debt of ₦', (d.amount_kobo / 100)::text) as description,
          d.amount_kobo,
          d.created_at
        FROM debts d
        JOIN members_circles mc ON mc.id = d.debtor_member_id
        WHERE mc.user_id = ${userId}
        UNION ALL
        SELECT
          'payout' as type,
          concat('Payout of ₦', (pt.amount_kobo / 100)::text) as description,
          pt.amount_kobo,
          pt.created_at
        FROM payout_transactions pt
        WHERE pt.recipient_user_id = ${userId}
      ) c2
      ORDER BY c2.created_at DESC
      LIMIT 50
    `;

    const cycleDebtRows = await db.execute(memberContributionView);

    const mappedCycle: ActivityItem[] = Array.isArray(cycleDebtRows)
      ? cycleDebtRows.map((r: Record<string, unknown>) => ({
          type: r.type as string,
          description: r.description as string,
          amountKobo: r.amount_kobo != null ? Number(r.amount_kobo) : undefined,
          createdAt:
            r.created_at instanceof Date
              ? r.created_at.toISOString()
              : String(r.created_at),
        }))
      : [];

    const allItems: ActivityItem[] = [
      ...walletTx.map((r) => ({
        type: r.type,
        description: r.description,
        amountKobo: r.amountKobo ?? undefined,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
      })),
      ...mappedCycle,
    ];

    allItems.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return success({ items: allItems.slice(0, 50) });
  } catch (e) {
    return handleApiError(e);
  }
}
