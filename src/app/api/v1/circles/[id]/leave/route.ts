import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { circles, debts, membersCircles } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const [circle] = await db
      .select()
      .from(circles)
      .where(eq(circles.id, id))
      .limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const [membership] = await db
      .select()
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.userId, auth.user?.userId),
          eq(membersCircles.circleId, id),
        ),
      )
      .limit(1);
    if (!membership) return error("Not a member of this circle");
    if (membership.status === "left") return error("Already left this circle");

    const activeDebts = await db
      .select()
      .from(debts)
      .where(
        and(
          eq(debts.debtorMemberId, membership.id),
          eq(debts.status, "active"),
        ),
      )
      .limit(1);
    if (activeDebts.length > 0) {
      return error(
        "Cannot leave circle with active debts. Clear your debts first.",
        "07",
      );
    }

    if (membership.role === "admin") {
      const otherAdmin = await db
        .select()
        .from(membersCircles)
        .where(
          and(
            eq(membersCircles.circleId, id),
            eq(membersCircles.role, "admin"),
            eq(membersCircles.status, "active"),
          ),
        )
        .limit(1);
      if (
        !otherAdmin ||
        (otherAdmin.length === 1 && otherAdmin[0].userId === auth.user?.userId)
      ) {
        return error(
          "Admin cannot leave without transferring admin role to another active member",
        );
      }
    }

    await db
      .update(membersCircles)
      .set({ status: "left", leftAt: new Date() })
      .where(eq(membersCircles.id, membership.id));

    return success({ message: "Left circle successfully" });
  } catch (e) {
    return handleApiError(e);
  }
}
