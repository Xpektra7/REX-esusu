import type { NextRequest } from "next/server";
import { handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { nombaGet } from "@/lib/nomba";

const FALLBACK_BANKS = [
  { code: "058", name: "GTBank" },
  { code: "044", name: "Access Bank" },
  { code: "011", name: "First Bank" },
  { code: "033", name: "UBA" },
  { code: "057", name: "Zenith Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "214", name: "FCMB" },
  { code: "232", name: "Sterling Bank" },
  { code: "032", name: "Union Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "221", name: "Stanbic IBTC" },
  { code: "502", name: "Kuda Bank" },
  { code: "999", name: "OPay" },
  { code: "505", name: "Moniepoint" },
  { code: "068", name: "Ecobank" },
  { code: "050", name: "EcoBank Nigeria" },
  { code: "082", name: "Keystone Bank" },
  { code: "063", name: "Heritage Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "215", name: "Unity Bank" },
  { code: "023", name: "Citibank Nigeria" },
];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const banksResp = await nombaGet("/v1/transfers/banks");
    const banks = Array.isArray(banksResp?.data)
      ? banksResp.data
      : banksResp?.data?.results || FALLBACK_BANKS;
    return success({ banks }, "Bank codes retrieved successfully");
  } catch {
    return success({ banks: FALLBACK_BANKS }, "Bank codes (fallback)");
  }
}
