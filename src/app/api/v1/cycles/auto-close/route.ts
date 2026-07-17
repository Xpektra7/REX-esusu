import { and, eq, lt } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { cycles } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { reconcileCycle } from "@/lib/reconciliation";

// GET /api/v1/cycles/auto-close
//
// Cron-friendly endpoint that auto-closes cycles past their deadline.
// Protect via CRON_SECRET env var — call from Vercel Cron Jobs, Inngest,
// Trigger.dev, or any scheduled task.
//
// Usage:
//   curl -X GET "https://yourapp.com/api/v1/cycles/auto-close" \
//     -H "x-cron-secret: ${CRON_SECRET}"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-cron-secret") || "";
    if (authHeader !== process.env.CRON_SECRET) {
      return error("Unauthorized", "03", 401);
    }

    // Find all active cycles whose deadline has passed
    const expiredCycles = await db
      .select({ id: cycles.id })
      .from(cycles)
      .where(
        and(eq(cycles.status, "active"), lt(cycles.deadlineAt, new Date())),
      );

    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    for (const c of expiredCycles) {
      try {
        await reconcileCycle(c.id);
        results.push({ id: c.id, success: true });
        console.info(`[AutoClose] Cycle ${c.id} closed successfully`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        console.error(`[AutoClose] Failed to close cycle ${c.id}:`, e);
        results.push({ id: c.id, success: false, error: msg });
      }
    }

    return success(
      {
        closed: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        details: results,
      },
      "Auto-close complete",
    );
  } catch (e) {
    return handleApiError(e);
  }
}
