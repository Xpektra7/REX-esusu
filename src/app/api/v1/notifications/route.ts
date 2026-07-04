import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { paginated } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const userId = auth.user.userId;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit")) || 20),
  );
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count: total }] = await db
    .select({
      count: db.$count(notifications, eq(notifications.userId, userId)),
    })
    .from(notifications);

  return paginated(rows, page, limit, total);
}
