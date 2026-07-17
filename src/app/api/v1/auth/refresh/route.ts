import { eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { signToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken, refresh_token } = await req.json();
    const token = refreshToken ?? refresh_token;
    if (!token) return error("Refresh token required");
    const payload = verifyToken(token);
    if (!payload) return error("Invalid or expired refresh token", "01", 401);

    // Rotate: increment sessionVersion to invalidate the old refresh token.
    // The new tokens get the new version, making the old pair unusable.
    const [updated] = await db
      .update(users)
      .set({ sessionVersion: sql`session_version + 1` })
      .where(eq(users.id, payload.userId))
      .returning({ sessionVersion: users.sessionVersion });
    if (!updated) return error("User not found", "04", 404);

    const newSv = updated.sessionVersion;
    const accessToken = signToken(payload.userId, payload.email, newSv);
    const newRefreshToken = signToken(payload.userId, payload.email, newSv);

    return success({
      accessToken,
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (e) {
    console.error(e);
    return error("An unexpected error occurred", "01", 500);
  }
}
