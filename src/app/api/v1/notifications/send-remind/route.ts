import { like } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { memberName, amountKobo, cycle } = await req.json();
    if (!memberName || !amountKobo || !cycle) {
      return error("memberName, amountKobo, and cycle are required");
    }

    const [member] = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.name, `%${memberName}%`))
      .limit(1);
    if (!member) return error("Member not found", "04", 404);

    await db.insert(notifications).values({
      userId: member.id,
      title: "Contribution Reminder",
      body: `Hi! This is a reminder to contribute ₦${(amountKobo / 100).toLocaleString()} for cycle ${cycle}. Please make your payment before the deadline.`,
      type: "reminder",
    });

    return success({ notified: 1 }, "Reminder sent");
  } catch (e) {
    return error((e as Error).message);
  }
}
