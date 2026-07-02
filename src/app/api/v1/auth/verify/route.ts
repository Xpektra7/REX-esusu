import { NextRequest } from "next/server";
import { success, error, conflict } from "@/lib/api-response";
import { verifyOtp } from "@/lib/otp";
import { hashPassword, verifyPassword, findUserByPhone, signToken } from "@/lib/auth";
import { db } from "@/db";
import { users, virtualAccounts } from "@/db/schema";
import { nombaPost } from "@/lib/nomba";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SANDBOX_URL = "https://sandbox.nomba.com/v1";
const ALGO = "aes-256-gcm";

function encryptBvn(plaintext: string): string {
  const key = Buffer.from(process.env.BVN_ENCRYPTION_KEY || "", "hex");
  if (key.length !== 32) throw new Error("BVN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

async function provisionVirtualAccount(userId: string, accountName: string, bvn?: string) {
  const baseUrl = process.env.NOMBA_BASE_URL || "https://api.nomba.com/v1";
  const isLive = !baseUrl.includes("sandbox");

  async function createVA(url: string): Promise<any> {
    const result = await nombaPost("/v1/accounts/virtual", {
      accountRef: userId,
      accountName,
      bvn: bvn || "",
      expiryDate: "2027-12-31",
    }, url);
    const vaBody = result?.data || result;
    if (vaBody) {
      await db.insert(virtualAccounts).values({
        userId,
        accountNumber: vaBody.bankAccountNumber || vaBody.accountNumber,
        accountName: vaBody.bankAccountName || vaBody.accountName,
        bankCode: vaBody.bankName || vaBody.bank || vaBody.bankCode,
        accountRef: vaBody.accountRef,
        type: "personal",
      });
    }
    return vaBody;
  }

  try {
    return await createVA(baseUrl);
  } catch (err) {
    if (isLive) {
      console.warn("Production VA creation failed, falling back to sandbox:", (err as Error).message);
      return await createVA(SANDBOX_URL);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, password, name, email, bvn } = await req.json();
    if (!phone || !otp || !password) return error("Phone, OTP, and password are required");

    if (!verifyOtp(phone, otp)) return error("Invalid or expired OTP");

    const existing = await findUserByPhone(phone);

    if (existing) {
      if (existing.lockedUntil && existing.lockedUntil > new Date()) {
        return error("Account locked. Try again later.");
      }

      const valid = await verifyPassword(password, existing.passwordHash);
      if (!valid) {
        const attempts = existing.loginAttempts + 1;
        let lockedUntil: Date | null = null;
        if (attempts >= 15) lockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        else if (attempts >= 10) lockedUntil = new Date(Date.now() + 60 * 60 * 1000);
        else if (attempts >= 5) lockedUntil = new Date(Date.now() + 15 * 60 * 1000);

        await db.update(users).set({ loginAttempts: attempts, lockedUntil }).where(eq(users.id, existing.id));
        if (lockedUntil) return error("Account locked. Try again later.");
        return error("Invalid password");
      }

      await db.update(users).set({ loginAttempts: 0, lockedUntil: null }).where(eq(users.id, existing.id));

      return success({
        user: { id: existing.id, phone: existing.phone, name: existing.name, email: existing.email },
        token: signToken(existing.id, existing.phone),
        refresh_token: signToken(existing.id, existing.phone),
        needs_bvn: !existing.bvnLast4,
        pin_set: !!existing.pinHash,
      });
    }

    if (!name || !email) return error("Name and email are required for signup");

    const emailCheck = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (emailCheck.length > 0) return conflict("Email already registered");

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(users).values({
      phone, name, email, passwordHash,
      bvnEncrypted: bvn ? encryptBvn(bvn) : null,
      bvnLast4: bvn ? bvn.slice(-4) : null,
    }).returning();

    try {
      await provisionVirtualAccount(user.id, name, bvn);
    } catch (vaErr) {
      console.error("VA provisioning failed (non-fatal):", vaErr instanceof Error ? vaErr.message : vaErr);
    }

    return success({
      user: { id: user.id, phone: user.phone, name: user.name, email: user.email },
      token: signToken(user.id, user.phone),
      refresh_token: signToken(user.id, user.phone),
      needs_bvn: !bvn,
      pin_set: false,
    }, "Account created");
  } catch (e) {
    return error((e as Error).message);
  }
}
