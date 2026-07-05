import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { error, notFound, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const userId = auth.user.userId;
  const { id } = await params;

  try {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    if (result.length === 0) return notFound("Notification not found");

    return success({ message: "Marked as read" });
  } catch (e) {
    return error((e as Error).message);
  }
}