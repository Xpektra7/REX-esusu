import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { signToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) return error("Refresh token required");
    const payload = verifyToken(refreshToken);
    if (!payload) return error("Invalid or expired refresh token", "01", 401);
    return success({ accessToken: signToken(payload.userId, payload.phone) });
  } catch (e) {
    return error((e as Error).message);
  }
}
