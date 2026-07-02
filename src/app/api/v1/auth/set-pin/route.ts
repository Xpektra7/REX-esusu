import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { verifyPassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { pin, currentPassword } = await req.json();
    if (!pin || pin.length < 4 || pin.length > 6) return error("PIN must be 4-6 digits");

    const [user] = await db.select().from(users).where(eq(users.id, auth.user!.userId)).limit(1);
    if (!user) return error("User not found", "04", 404);

    // Require currentPassword only when changing an existing PIN
    if (user.pinHash && !(await verifyPassword(currentPassword, user.passwordHash))) {
      return error("Current password is incorrect");
    }

    const pinHash = await bcrypt.hash(pin, 12);
    await db.update(users).set({ pinHash }).where(eq(users.id, user.id));
    return success({ message: "PIN set successfully" });
  } catch (e) {
    return error((e as Error).message);
  }
}
