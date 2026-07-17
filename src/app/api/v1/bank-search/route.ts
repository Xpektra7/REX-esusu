import type { NextRequest } from "next/server";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

const BANKS: { code: string; name: string }[] = [
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
  { code: "035", name: "Wema Bank" },
  { code: "215", name: "Unity Bank" },
  { code: "023", name: "Citibank Nigeria" },
];

const ACCOUNT_PREFIX_MAP: Record<string, string[]> = {
  "01": ["058", "044"],
  "02": ["044", "058"],
  "03": ["011", "033"],
  "04": ["033", "011"],
  "05": ["057", "035"],
  "06": ["035", "214"],
  "07": ["214", "232"],
  "08": ["232", "502"],
  "09": ["032", "024"],
  "10": ["070", "221"],
  "11": ["221", "070"],
  "12": ["502", "999"],
  "13": ["999", "505"],
  "14": ["505", "999"],
};

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { accountNumber } = await req.json();

    if (
      !accountNumber ||
      accountNumber.length !== 10 ||
      !/^\d{10}$/.test(accountNumber)
    ) {
      return error("Account number must be 10 digits");
    }

    const prefix = accountNumber.slice(0, 2);
    const matchingCodes = ACCOUNT_PREFIX_MAP[prefix] ?? [];
    const matches = matchingCodes.map((code) => {
      const bank = BANKS.find((b) => b.code === code);
      return {
        bankCode: code,
        bankName: bank?.name ?? "Unknown Bank",
        accountName: "CHIOMA OKAFOR",
      };
    });

    return success({ matches }, "Bank search successful");
  } catch (e) {
    return handleApiError(e);
  }
}
