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
  reminder24h: z.boolean().optional(),
  reminder6h: z.boolean().optional(),
  reminderDeadline: z.boolean().optional(),
  reminderGraceExpiry: z.boolean().optional(),
  notifyPaymentReceived: z.boolean().optional(),
  notifyDebtCleared: z.boolean().optional(),
  notifyCycleReminders: z.boolean().optional(),
  notifyPayout: z.boolean().optional(),
  notifyDefaultAlert: z.boolean().optional(),
  notifyCircleInvite: z.boolean().optional(),
  notifyTrustScore: z.boolean().optional(),
  notifyWithdrawal: z.boolean().optional(),
});

const defaultSettings = {
  autoPay: false,
  pushEnabled: true,
  reminder24h: true,
  reminder6h: true,
  reminderDeadline: true,
  reminderGraceExpiry: false,
  notifyPaymentReceived: true,
  notifyDebtCleared: true,
  notifyCycleReminders: true,
  notifyPayout: true,
  notifyDefaultAlert: true,
  notifyCircleInvite: true,
  notifyTrustScore: true,
  notifyWithdrawal: true,
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
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const settings = await getOrCreateSettings(auth.user.userId);
    return success({
      autoPay: settings.autoPay,
      pushEnabled: settings.pushEnabled,
      reminder24h: settings.reminder24h,
      reminder6h: settings.reminder6h,
      reminderDeadline: settings.reminderDeadline,
      reminderGraceExpiry: settings.reminderGraceExpiry,
      notifyPaymentReceived: settings.notifyPaymentReceived,
      notifyDebtCleared: settings.notifyDebtCleared,
      notifyCycleReminders: settings.notifyCycleReminders,
      notifyPayout: settings.notifyPayout,
      notifyDefaultAlert: settings.notifyDefaultAlert,
      notifyCircleInvite: settings.notifyCircleInvite,
      notifyTrustScore: settings.notifyTrustScore,
      notifyWithdrawal: settings.notifyWithdrawal,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
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
