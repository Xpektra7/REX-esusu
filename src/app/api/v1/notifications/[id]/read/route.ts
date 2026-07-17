import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { error, handleApiError, notFound, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const userId = auth.user.userId;
  const { id } = await params;

  if (!UUID_RE.test(id)) return error("Invalid notification ID", "01", 422);

  try {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    if (result.length === 0) return notFound("Notification not found");

    return success({ message: "Marked as read" });
  } catch (e) {
    return handleApiError(e);
  }
}
