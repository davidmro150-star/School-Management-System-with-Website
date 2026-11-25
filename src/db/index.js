
import "dotenv/config";

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing from the root .env file."
  );
}

const globalForDb = globalThis;

// Reuse the connection pool during Next.js development.
const pool =
  globalForDb.__edumanagePool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__edumanagePool = pool;
}

// Initialize Drizzle ORM.
export const db = drizzle(pool, {
  schema,
});

// Export pool for testing and controlled shutdown.
export { pool };
