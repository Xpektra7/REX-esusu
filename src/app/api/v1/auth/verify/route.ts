import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users, virtualAccounts } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import {
  findUserByEmail,
  hashPassword,
  signToken,
  verifyPassword,
} from "@/lib/auth";
import { nombaPost } from "@/lib/nomba";
import { verifyOtp } from "@/lib/otp";

const SANDBOX_URL = "https://sandbox.nomba.com/v1";
const ALGO = "aes-256-gcm";

function encryptBvn(plaintext: string): string {
  const key = Buffer.from(process.env.BVN_ENCRYPTION_KEY || "", "hex");
  if (key.length !== 32)
    throw new Error(
      "BVN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)",
    );
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

async function provisionVirtualAccount(
  userId: string,
  accountName: string,
  bvn?: string,
) {
  const subAccountId = process.env.NOMBA_SUB_ACCOUNT_ID || "";
  const baseUrl = process.env.NOMBA_BASE_URL || "https://api.nomba.com/v1";
  const isLive = !baseUrl.includes("sandbox");

  async function createVA(url: string): Promise<Record<string, unknown>> {
    const vaPath = subAccountId
      ? `/v1/accounts/virtual/${subAccountId}`
      : "/v1/accounts/virtual";
    const result = await nombaPost(
      vaPath,
      {
        accountRef: userId,
        accountName,
        bvn: bvn || "",
        expiryDate: "2027-12-31",
      },
      url,
    );
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
      console.warn(
        "Production VA creation failed, falling back to sandbox:",
        (err as Error).message,
      );
      return await createVA(SANDBOX_URL);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password, name, bvn } = await req.json();
    if (!email || !otp || !password)
      return error("Email, OTP, and password are required");

    if (!(await verifyOtp(email, otp))) return error("Invalid or expired OTP");

    const existing = await findUserByEmail(email);

    if (existing) {
      if (existing.lockedUntil && existing.lockedUntil > new Date()) {
        return error("Account locked. Try again later.");
      }

      const valid = await verifyPassword(password, existing.passwordHash);
      if (!valid) {
        const attempts = existing.loginAttempts + 1;
        let lockedUntil: Date | null = null;
        if (attempts >= 15)
          lockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        else if (attempts >= 10)
          lockedUntil = new Date(Date.now() + 60 * 60 * 1000);
        else if (attempts >= 5)
          lockedUntil = new Date(Date.now() + 15 * 60 * 1000);

        await db
          .update(users)
          .set({ loginAttempts: attempts, lockedUntil })
          .where(eq(users.id, existing.id));
        if (lockedUntil) return error("Account locked. Try again later.");
        return error("Invalid password");
      }

      await db
        .update(users)
        .set({ loginAttempts: 0, lockedUntil: null })
        .where(eq(users.id, existing.id));

      return success({
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
        },
        token: signToken(existing.id, existing.email),
        refreshToken: signToken(existing.id, existing.email),
        needsBvn: false,
        pinSet: !!existing.pinHash,
      });
    }

    if (!name) return error("No account found with this email. Sign up first.");

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        bvnEncrypted: bvn ? encryptBvn(bvn) : null,
        bvnLast4: bvn ? bvn.slice(-4) : null,
      })
      .returning();

    try {
      await provisionVirtualAccount(user.id, name, bvn);
    } catch (vaErr) {
      console.error(
        "VA provisioning failed (non-fatal):",
        vaErr instanceof Error ? vaErr.message : vaErr,
      );
    }

    return success(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token: signToken(user.id, user.email),
        refreshToken: signToken(user.id, user.email),
        needsBvn: false,
        pinSet: false,
      },
      "Account created",
    );
  } catch (e) {
    console.error(e);
    return error("An unexpected error occurred", "01", 500);
  }
}
