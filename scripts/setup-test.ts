import { db } from "../src/db";
import { users, virtualAccounts, walletTransactions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const BASE = "https://nomba-lovat.vercel.app/api/v1";

async function auth(phone: string) {
  await fetch(`${BASE}/auth/send-otp`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const v = await fetch(`${BASE}/auth/verify`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp: "999999", password: "qwertyuiop", name: "Test User", email: `test_${phone.slice(-4)}@test.com` }),
  }).then(r => r.json());
  return v?.data?.token;
}

async function main() {
  // 1. Create circle as Test User
  const token1 = await auth("+2348000000123");
  const circle = await fetch(`${BASE}/circles`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ name: "Test Circle", contributionAmountKobo: 100000, frequency: "weekly", cycleCount: 12 }),
  }).then(r => r.json());
  const code = circle?.data?.inviteCode;
  const circleId = circle?.data?.id;
  console.log(`Circle: ${circleId} Code: ${code}`);

  // 2. Join Alice
  const token2 = await auth("+2348000000124");
  const join = await fetch(`${BASE}/circles/${circleId}/join`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token2}` },
    body: JSON.stringify({ invite_code: code }),
  }).then(r => r.json());
  console.log(`Alice joined: ${join.code}`);

  // 3. Top up wallets (₦10,000 = 1,000,000 kobo each)
  const amountKobo = 1_000_000;
  for (const phone of ["+2348000000123", "+2348000000124"]) {
    const [u] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    if (!u) { console.log(`User ${phone} not found in DB`); continue; }

    // Update VA balance
    const [va] = await db.select().from(virtualAccounts).where(eq(virtualAccounts.userId, u.id)).limit(1);
    if (va) {
      await db.update(virtualAccounts).set({ balanceKobo: va.balanceKobo + amountKobo }).where(eq(virtualAccounts.id, va.id));
    } else {
      console.log(`No VA for ${phone}, creating one`);
      await db.insert(virtualAccounts).values({
        userId: u.id, accountNumber: `000${Math.random().toString().slice(2,12)}`,
        accountName: u.name, bankCode: "999", type: "personal", balanceKobo: amountKobo,
      });
    }

    // Record transaction
    await db.insert(walletTransactions).values({
      userId: u.id, type: "credit", amountKobo, reference: `TOPUP-${Date.now()}-${phone.slice(-4)}`,
      status: "completed",
    });
    console.log(`${phone}: ₦10,000 added`);
  }

  console.log("Done");
}
main();
