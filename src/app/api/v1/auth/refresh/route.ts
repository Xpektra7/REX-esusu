import type { NextRequest } from "next/server";
import { error, success } from "@/lib/api-response";
import { signToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken, refresh_token } = await req.json();
    const token = refreshToken ?? refresh_token;
    if (!token) return error("Refresh token required");
    const payload = verifyToken(token);
    if (!payload) return error("Invalid or expired refresh token", "01", 401);
    const accessToken = signToken(payload.userId, payload.phone);
    return success({ accessToken, token: accessToken });
  } catch (e) {
    return error((e as Error).message);
  }
}
