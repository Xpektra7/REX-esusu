import { eq, inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { debts, membersCircles } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const userId = auth.user.userId;

  try {
    const memberships = await db
      .select({ id: membersCircles.id })
      .from(membersCircles)
      .where(eq(membersCircles.userId, userId));

    const memberIds = memberships.map((m) => m.id);

    if (memberIds.length === 0) {
      return success({ outgoing: [], incoming: [] });
    }

    const outgoing = await db
      .select()
      .from(debts)
      .where(inArray(debts.debtorMemberId, memberIds));

    const incoming = await db
      .select()
      .from(debts)
      .where(inArray(debts.creditorMemberId, memberIds));

    return success({ outgoing, incoming });
  } catch (e) {
    return error((e as Error).message);
  }
}