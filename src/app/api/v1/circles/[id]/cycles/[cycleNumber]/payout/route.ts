import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { circles, cycles, membersCircles, users, virtualAccounts, payoutTransactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nombaPost } from "@/lib/nomba";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; cycleNumber: string }> }) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id, cycleNumber } = await params;
    const cycleNum = parseInt(cycleNumber, 10);
    if (isNaN(cycleNum)) return error("Invalid cycle number");

    const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const [membership] = await db.select().from(membersCircles)
      .where(and(eq(membersCircles.circleId, id), eq(membersCircles.userId, auth.user!.userId)))
      .limit(1);
    if (!membership || membership.role !== "admin") return error("Only admin can trigger payout", "03", 403);

    const [cycle] = await db.select().from(cycles)
      .where(and(eq(cycles.circleId, id), eq(cycles.cycleNumber, cycleNum)))
      .limit(1);
    if (!cycle) return error("Cycle not found", "04", 404);
    if (cycle.status !== "active") return error("Cycle is not active");

    const [recipient] = await db.select({
      userId: membersCircles.userId,
      name: users.name,
      phone: users.phone,
    }).from(membersCircles).innerJoin(users, eq(users.id, membersCircles.userId))
      .where(eq(membersCircles.id, cycle.recipientMemberId)).limit(1);
    if (!recipient) return error("Recipient not found");

    const [recipientVA] = await db.select().from(virtualAccounts)
      .where(and(eq(virtualAccounts.userId, recipient.userId), eq(virtualAccounts.type, "personal")))
      .limit(1);

    let nombaResp: any = {};
    const merchantTxRef = `PO_${id.slice(0, 8)}_${cycleNum}_${Date.now()}`;
    let transferRef = merchantTxRef;

    // Get admin's name for senderName
    const [adminUser] = await db.select().from(users).where(eq(users.id, auth.user!.userId)).limit(1);

    if (recipientVA) {
      try {
        nombaResp = await nombaPost("/v2/transfers/bank", {
          amount: cycle.actualTotalKobo,
          bankCode: recipientVA.bankCode || "000",
          accountNumber: recipientVA.accountNumber,
          accountName: recipientVA.accountName,
          senderName: adminUser?.name || "Esusu",
          merchantTxRef: transferRef,
          narration: `Payout Cycle ${cycleNum} - ${circle.name}`,
        });
        transferRef = nombaResp?.data?.meta?.merchantTxRef || nombaResp?.data?.id || merchantTxRef;
      } catch (nombaErr) {
        console.error("Nomba transfer failed, recording as pending:", nombaErr);
      }
    }

    const [payout] = await db.insert(payoutTransactions).values({
      cycleId: cycle.id,
      recipientUserId: recipient.userId,
      amountKobo: cycle.actualTotalKobo,
      nombaTransferRef: transferRef,
      status: "pending",
      nombaResponse: nombaResp,
    }).returning();

    await db.update(cycles).set({
      status: nombaResp?.status === "SUCCESS" || nombaResp?.data?.status === "SUCCESS" ? "paid_out" : "active",
      closedAt: new Date(),
    }).where(eq(cycles.id, cycle.id));

    return success({
      payoutId: payout.id,
      amountKobo: cycle.actualTotalKobo,
      recipient: recipient.name,
      status: payout.status,
      nombaTransferRef: transferRef,
    }, "Payout initiated");
  } catch (e) {
    return error((e as Error).message);
  }
}