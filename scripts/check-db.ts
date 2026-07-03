import { db } from "../src/db";
import { users, circles } from "../src/db/schema";

async function main() {
  const u = await db.select().from(users);
  const c = await db.select().from(circles);
  console.log(`Users: ${u.length}, Circles: ${c.length}`);
}
main();
