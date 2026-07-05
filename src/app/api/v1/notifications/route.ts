import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { error, paginated } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { paginationSchema } from "@/lib/validations/pagination";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const userId = auth.user.userId;

  const { searchParams } = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return error("Invalid pagination parameters");
  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db.$count(notifications, eq(notifications.userId, userId));

    return paginated(rows, page, limit, total);
  } catch (e) {
    return error((e as Error).message);
  }
}