import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { verifyPassword } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware";
import { pinSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const body = pinSchema
      .extend({ currentPassword: z.string().optional() })
      .safeParse(await req.json());
    if (!body.success) return error(body.error.issues[0].message, "02");
    const { pin, currentPassword } = body.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.user?.userId))
      .limit(1);
    if (!user) return error("User not found", "04", 404);

    // Require currentPassword only when changing an existing PIN
    if (user.pinHash) {
      if (!currentPassword)
        return error("Current password is required to change PIN");
      if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        return error("Current password is incorrect");
      }
    }

    const pinHash = await bcrypt.hash(pin, 12);
    await db.update(users).set({ pinHash }).where(eq(users.id, user.id));
    return success({ message: "PIN set successfully" });
  } catch (e) {
    console.error(e);
    return error("An unexpected error occurred", "01", 500);
  }
}
