import { NextResponse } from "next/server";

export async function POST(req: Request) {
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
