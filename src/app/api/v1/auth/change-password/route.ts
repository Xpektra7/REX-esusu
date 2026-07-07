import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return error("currentPassword and newPassword are required");
    }
    if (newPassword.length < 8) {
      return error("New password must be at least 8 characters", "01", 422);
    }

    const userId = auth.user.userId;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) return error("User not found", "04", 404);

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return error("Current password is incorrect");

    const passwordHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return success({}, "Password changed successfully");
  } catch (e) {
    return error((e as Error).message);
  }
}
