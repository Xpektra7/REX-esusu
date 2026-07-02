import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { signToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { refresh_token } = await req.json();
    if (!refresh_token) return error("Refresh token required");
    const payload = verifyToken(refresh_token);
    if (!payload) return error("Invalid or expired refresh token", "01", 401);
    return success({ token: signToken(payload.userId, payload.phone) });
  } catch (e) {
    return error((e as Error).message);
  }
}
