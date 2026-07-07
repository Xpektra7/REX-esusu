import bcrypt from "bcryptjs";
import type { StringValue } from "ms";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users } from "@/db/schema";

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "30m") as StringValue;

type TokenPayload = { userId: string; email: string };

export function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email } satisfies TokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
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
