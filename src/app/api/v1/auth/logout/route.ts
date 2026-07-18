import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // Increment session version to invalidate all existing JWTs
  await db
    .update(users)
    .set({ sessionVersion: sql`session_version + 1` })
    .where(eq(users.id, auth.user?.userId));

  return NextResponse.json(
    { code: "00", description: "Logged out", data: null },
    {
      headers: {
        "Set-Cookie":
          "esusu-token=; path=/; max-age=0; HttpOnly; Secure; SameSite=Strict",
      },
    },
  );
}
