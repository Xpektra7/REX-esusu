import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications, webhookEvents } from "@/db/schema";
import { handlePayoutFailedInTx, handlePayoutSuccessInTx } from "@/lib/payout";
import { reconcilePaymentInTx } from "@/lib/reconciliation";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("nomba-signature") || "";
    const timestamp = request.headers.get("nomba-timestamp") || "";

    const secret = process.env.NOMBA_WEBHOOK_SECRET;
    if (!secret) {
      return new Response(
        JSON.stringify({ code: "01", description: "misconfigured" }),
        { status: 500 },
      );
    }
    const payload = JSON.parse(rawBody);
    const data = payload.data || {};
    const merchant = data.merchant || {};
    const transaction = data.transaction || {};

    let responseCode = transaction.responseCode ?? "";
    if (responseCode === "null") responseCode = "";

    const sigPayload = [
      payload.event_type ?? "",
      payload.requestId ?? "",
      merchant.userId ?? "",
      merchant.walletId ?? "",
      transaction.transactionId ?? "",
      transaction.type ?? "",
      transaction.time ?? "",
      responseCode,
      timestamp,
    ].join(":");

    const expected = crypto
      .createHmac("sha256", secret)
      .update(sigPayload)
      .digest("base64");
    const received = signature;

    if (
      expected.length !== received.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
    ) {
      return new Response(
        JSON.stringify({ code: "01", description: "bad signature" }),
        { status: 401 },
      );
    }

    const tsMs = /^\d+$/.test(timestamp)
      ? parseInt(timestamp, 10)
      : new Date(timestamp).getTime();
    if (Number.isNaN(tsMs) || Math.abs(Date.now() - tsMs) > 3_600_000) {
      return new Response(
        JSON.stringify({ code: "01", description: "expired" }),
        { status: 401 },
      );
    }

    const existing = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.nombaRequestId, payload.requestId))
      .limit(1);

    // Terminal states: already successfully processed.
    if (
      existing.length > 0 &&
      (existing[0].status === "processed" || existing[0].status === "unhandled")
    ) {
      return new Response(
        JSON.stringify({ code: "00", description: "duplicate" }),
      );
    }

    // Anchor with a dedup row so concurrent deliveries can't double-process.
    if (existing.length > 0) {
      await db
        .update(webhookEvents)
        .set({ status: "received" })
        .where(eq(webhookEvents.nombaRequestId, payload.requestId));
    } else {
      await db.insert(webhookEvents).values({
        nombaRequestId: payload.requestId,
        eventType: payload.event_type,
        rawPayload: payload,
        status: "received",
      });
    }

    // Process the event. Every handled event type wraps both the business logic
    // AND the status update in a single db.transaction so that if a crash occurs
    // after the business logic completes but before the status update, the entire
    // transaction rolls back. Nomba retries safely.
    await processWebhook(payload);

    return new Response(
      JSON.stringify({ code: "00", description: "Received" }),
    );
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(
      JSON.stringify({ code: "09", description: "Processing failed" }),
      { status: 500 },
    );
  }
}

const HANDLED_EVENTS = new Set([
  "payment_success",
  "payment_failed",
  "payment_reversal",
  "payout_success",
  "payout_failed",
  "payout_refund",
]);

// biome-ignore lint/suspicious/noExplicitAny: Nomba webhook payload shape is dynamic
async function processWebhook(payload: any) {
  const requestId = payload.requestId;
  const eventType = payload.event_type;

  try {
    switch (eventType) {
      // -------------------------------------------------------------------
      // payment_success — reconcile + status update in ONE transaction
      // -------------------------------------------------------------------
      case "payment_success":
        await db.transaction(async (tx) => {
          await reconcilePaymentInTx(tx, payload);
          await tx
            .update(webhookEvents)
            .set({ status: "processed", processedAt: new Date() })
            .where(eq(webhookEvents.nombaRequestId, requestId));
        });
        return;

      // -------------------------------------------------------------------
      // payout_success / payout_failed — payout + status in ONE transaction
      // -------------------------------------------------------------------
      case "payout_success":
        await db.transaction(async (tx) => {
          await handlePayoutSuccessInTx(tx, payload);
          await tx
            .update(webhookEvents)
            .set({ status: "processed", processedAt: new Date() })
            .where(eq(webhookEvents.nombaRequestId, requestId));
        });
        return;

      case "payout_failed":
        await db.transaction(async (tx) => {
          await handlePayoutFailedInTx(tx, payload);
          await tx
            .update(webhookEvents)
            .set({ status: "processed", processedAt: new Date() })
            .where(eq(webhookEvents.nombaRequestId, requestId));
        });
        return;

      // -------------------------------------------------------------------
      // Unhandled / non-financial events — just record status
      // -------------------------------------------------------------------
      case "payment_failed":
        console.warn(
          `[Webhook] Unhandled event type '${eventType}' — ack'd but no action taken`,
        );
        await db
          .update(webhookEvents)
          .set({ status: "unhandled", processedAt: new Date() })
          .where(eq(webhookEvents.nombaRequestId, requestId));
        return;

      case "payment_reversal":
        console.warn(
          `[Webhook] payment_reversal for request ${requestId} — notifying user`,
        );
        await db.transaction(async (tx) => {
          await tx
            .update(webhookEvents)
            .set({ status: "unhandled", processedAt: new Date() })
            .where(eq(webhookEvents.nombaRequestId, requestId));
          try {
            const revUserId = payload.data?.merchant?.userId;
            if (revUserId) {
              await tx.insert(notifications).values({
                userId: revUserId,
                title: "Payment reversed",
                body: "A previous payment was reversed. Contact support if you have questions.",
                type: "payment",
              });
            }
          } catch (nErr) {
            console.error(
              "[Webhook] Failed to send reversal notification:",
              nErr,
            );
          }
        });
        return;

      case "payout_refund":
        console.warn(
          `[Webhook] payout_refund for request ${requestId} — notifying user`,
        );
        await db.transaction(async (tx) => {
          await tx
            .update(webhookEvents)
            .set({ status: "unhandled", processedAt: new Date() })
            .where(eq(webhookEvents.nombaRequestId, requestId));
          try {
            const refUserId = payload.data?.merchant?.userId;
            if (refUserId) {
              await tx.insert(notifications).values({
                userId: refUserId,
                title: "Payout refunded",
                body: "A previous payout was refunded. Contact support if you have questions.",
                type: "payment",
              });
            }
          } catch (nErr) {
            console.error(
              "[Webhook] Failed to send refund notification:",
              nErr,
            );
          }
        });
        return;

      default: {
        const isKnown = HANDLED_EVENTS.has(eventType);
        console.error(
          `[Webhook] Untracked event type '${eventType}' — known=${isKnown}`,
        );
        await db
          .update(webhookEvents)
          .set({ status: "unhandled", processedAt: new Date() })
          .where(eq(webhookEvents.nombaRequestId, requestId));
        return;
      }
    }
  } catch (e) {
    console.error(`[Webhook] Processing failed for ${eventType}:`, e);
    await db
      .update(webhookEvents)
      .set({ status: "failed" })
      .where(eq(webhookEvents.nombaRequestId, requestId));
    throw e;
  }
}
