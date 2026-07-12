import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { currentPin, newPin } = await req.json();
    if (!currentPin || !newPin) {
      return error("currentPin and newPin are required");
    }
    if (!/^\d{4}$/.test(newPin)) {
      return error("New PIN must be exactly 4 digits", "01", 422);
    }

    const userId = auth.user.userId;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) return error("User not found", "04", 404);

    if (user.pinHash) {
      const valid = await bcrypt.compare(currentPin, user.pinHash);
      if (!valid) return error("Current PIN is incorrect");
    }

    const pinHash = await bcrypt.hash(newPin, 12);
    await db.update(users).set({ pinHash }).where(eq(users.id, userId));

    return success({}, "PIN changed successfully");
  } catch (e) {
    console.error(e);
    return error("An unexpected error occurred", "01", 500);
  }
}
