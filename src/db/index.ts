import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { _dbClient?: postgres.Sql; _db?: ReturnType<typeof drizzle> };

if (!globalForDb._db) {
  globalForDb._dbClient = postgres(process.env.DATABASE_URL!, { max: 3, idle_timeout: 30, connect_timeout: 15 });
  globalForDb._db = drizzle(globalForDb._dbClient, { schema });
}

export const db = globalForDb._db!;
