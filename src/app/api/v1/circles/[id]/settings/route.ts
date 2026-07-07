import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { circles } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const [circle] = await db
      .select()
      .from(circles)
      .where(eq(circles.id, id))
      .limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const body = await req.json();

    if (body.allowMidCycleJoin !== undefined) {
      await db
        .update(circles)
        .set({ allowMidCycleJoin: body.allowMidCycleJoin })
        .where(eq(circles.id, id));
    }

    const [updated] = await db
      .select()
      .from(circles)
      .where(eq(circles.id, id))
      .limit(1);

    return success(updated);
  } catch (e) {
    return error((e as Error).message);
  }
}
