import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { pin } = await req.json();
    if (!pin) return error("PIN is required");

    const [user] = await db.select().from(users).where(eq(users.id, auth.user!.userId)).limit(1);
    if (!user || !user.pinHash) return error("PIN not set");

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) return error("Invalid PIN");

    return success({ verified: true });
  } catch (e) {
    return error((e as Error).message);
  }
}
