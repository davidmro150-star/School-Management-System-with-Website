
import "dotenv/config";

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as cmsSchema from "./schema.js";
import * as authSchema from "./auth-schema.js";

// Combine all application and authentication tables.
export const schema = {
  ...cmsSchema,
  ...authSchema,
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

// Reuse the pool during Next.js development.
const globalForDb = globalThis;

export const pool =
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

// Initialize Drizzle with all database schemas.
export const db = drizzle(pool, {
  schema,
});
