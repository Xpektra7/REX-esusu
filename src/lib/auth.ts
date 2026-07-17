import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { db } from "@/db";
import { users } from "@/db/schema";

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
})();
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "30m") as StringValue;

type TokenPayload = { userId: string; email: string };

export function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email } satisfies TokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export function setAuthCookie(response: Response, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  response.headers.set(
    "Set-Cookie",
    `esusu-token=${token}; HttpOnly; ${isProd ? "Secure;" : ""} Path=/; Max-Age=1800; SameSite=Strict`,
  );
}

export function clearAuthCookie(response: Response): void {
  response.headers.set(
    "Set-Cookie",
    "esusu-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict",
  );
}

const REFRESH_EXPIRES_IN = "7d" as StringValue;

export function signRefreshToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, type: "refresh" } satisfies TokenPayload & { type: string }, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}
