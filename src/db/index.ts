import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  _dbClient?: postgres.Sql;
  _db?: ReturnType<typeof drizzle>;
};

const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl) {
  throw new Error("DATABASE_URL not configured");
}

if (!globalForDb._db) {
  globalForDb._dbClient = postgres(dbUrl, {
    max: 3,
    idle_timeout: 30,
    connect_timeout: 15,
  });
  globalForDb._db = drizzle(globalForDb._dbClient, { schema });
}

// biome-ignore lint/style/noNonNullAssertion: guaranteed set above
export const db = globalForDb._db!;
