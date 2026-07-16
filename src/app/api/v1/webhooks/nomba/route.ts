import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications, webhookEvents } from "@/db/schema";
import { handlePayoutFailed, handlePayoutSuccess } from "@/lib/payout";
import { reconcilePayment } from "@/lib/reconciliation";

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

    // Terminal states: already successfully processed, or intentionally
    // unhandled (no action needed). Nothing to do — ack Nomba.
    if (
      existing.length > 0 &&
      (existing[0].status === "processed" || existing[0].status === "unhandled")
    ) {
      return new Response(
        JSON.stringify({ code: "00", description: "duplicate" }),
      );
    }

    // No record yet, or a previous attempt failed ("received"/"failed") →
    // (re)process. Anchor with a dedup row (insert on first try, update on
    // retry) so concurrent deliveries can't double-process and failures can
    // be retried.
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

    // Reconcile now. On failure processWebhook records "failed" and re-throws,
    // so we fall through to the catch and return "09" — Nomba retries the
    // delivery instead of treating the payment as successfully processed.
    await processWebhook(payload);

    return new Response(
      JSON.stringify({ code: "00", description: "Received" }),
    );
  } catch (e) {
    console.error("Webhook error:", e);
    // "09" = temporary failure — Nomba will retry with backoff instead of
    // treating the payment as successfully processed.
    return new Response(
      JSON.stringify({ code: "09", description: "Processing failed" }),
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
      case "payment_success":
        await reconcilePayment(payload);
        break;
      case "payout_success":
        await handlePayoutSuccess(payload);
        break;
      case "payout_failed":
        await handlePayoutFailed(payload);
        break;
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
        await db
          .update(webhookEvents)
          .set({ status: "unhandled", processedAt: new Date() })
          .where(eq(webhookEvents.nombaRequestId, requestId));
        try {
          const revUserId = payload.data?.merchant?.userId;
          if (revUserId) {
            await db.insert(notifications).values({
              userId: revUserId,
              title: "Payment reversed",
              body: "A previous payment was reversed. Contact support if you have questions.",
              type: "payment",
            });
          }
        } catch (nErr) {
          console.error("[Webhook] Failed to send reversal notification:", nErr);
        }
        return;
      case "payout_refund":
        console.warn(
          `[Webhook] payout_refund for request ${requestId} — notifying user`,
        );
        await db
          .update(webhookEvents)
          .set({ status: "unhandled", processedAt: new Date() })
          .where(eq(webhookEvents.nombaRequestId, requestId));
        try {
          const refUserId = payload.data?.merchant?.userId;
          if (refUserId) {
            await db.insert(notifications).values({
              userId: refUserId,
              title: "Payout refunded",
              body: "A previous payout was refunded. Contact support if you have questions.",
              type: "payment",
            });
          }
        } catch (nErr) {
          console.error("[Webhook] Failed to send refund notification:", nErr);
        }
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

    await db
      .update(webhookEvents)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(webhookEvents.nombaRequestId, requestId));
  } catch (e) {
    console.error(`[Webhook] Processing failed for ${eventType}:`, e);
    await db
      .update(webhookEvents)
      .set({ status: "failed" })
      .where(eq(webhookEvents.nombaRequestId, requestId));
    // Re-throw so the route returns "09" and Nomba retries the delivery.
    throw e;
  }
}
