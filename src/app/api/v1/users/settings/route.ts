import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

const updateSchema = z.object({
  autoPay: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  reminderDueDate: z.boolean().optional(),
  reminderCycleStart: z.boolean().optional(),
  reminderPaymentConfirm: z.boolean().optional(),
  reminderDebt: z.boolean().optional(),
  notifContribution: z.boolean().optional(),
  notifPayout: z.boolean().optional(),
  notifDebt: z.boolean().optional(),
  notifCycle: z.boolean().optional(),
  notifMember: z.boolean().optional(),
  notifReferral: z.boolean().optional(),
  notifSystem: z.boolean().optional(),
  notifPromo: z.boolean().optional(),
});

const defaultSettings = {
  autoPay: false,
  pushEnabled: true,
  reminderDueDate: true,
  reminderCycleStart: true,
  reminderPaymentConfirm: true,
  reminderDebt: true,
  notifContribution: true,
  notifPayout: true,
  notifDebt: true,
  notifCycle: true,
  notifMember: true,
  notifReferral: true,
  notifSystem: true,
  notifPromo: true,
};

async function getOrCreateSettings(userId: string) {
  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(userSettings)
    .values({ userId, ...defaultSettings })
    .returning();
  return created;
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const settings = await getOrCreateSettings(auth.user.userId);
    return success({
      autoPay: settings.autoPay,
      pushEnabled: settings.pushEnabled,
      reminders: {
        dueDate: settings.reminderDueDate,
        cycleStart: settings.reminderCycleStart,
        paymentConfirm: settings.reminderPaymentConfirm,
        debt: settings.reminderDebt,
      },
      notifications: {
        contribution: settings.notifContribution,
        payout: settings.notifPayout,
        debt: settings.notifDebt,
        cycle: settings.notifCycle,
        member: settings.notifMember,
        referral: settings.notifReferral,
        system: settings.notifSystem,
        promo: settings.notifPromo,
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return error("Invalid settings values", "01", 422);
    }

    await getOrCreateSettings(auth.user.userId);

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      return error("Nothing to update");
    }

    await db
      .update(userSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettings.userId, auth.user.userId));

    return success({}, "Settings updated");
  } catch (e) {
    return handleApiError(e);
  }
}
