import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  // TODO: verify BVN via NIBSS or Nomba API
  // Mock: any 11-digit BVN returns success
  if (!/^\d{11}$/.test(body.bvn)) {
    return NextResponse.json({
      code: "02",
      description: "Invalid BVN",
      data: null,
    });
  }

  // D16: reject if this BVN is already registered to a different user.
  // Note: the schema only stores `bvnLast4` (the full BVN is encrypted), so
  // this is a mock-level check on the last 4 digits — a real NIBSS lookup
  // would match the full BVN exactly.
  const last4 = body.bvn.slice(-4);
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.bvnLast4, last4))
    .limit(1);
  if (existing && existing.id !== auth.user.userId) {
    return NextResponse.json({
      code: "05",
      description: "BVN already registered",
      data: null,
    });
  }

  return NextResponse.json({
    code: "00",
    description: "BVN verified",
    data: {
      verified: true,
      name: "Chioma Okafor",
      dob: "15-03-1990",
    },
  });
}
