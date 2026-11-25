
import "dotenv/config";
import { Pool } from "pg";

const requiredTables = [
  "website_pages",
  "media_assets",
  "website_notices",
  "website_events",
  "gallery_albums",
  "gallery_items",
  "navigation_items",
  "site_settings",
  "content_revisions",
  "user",
  "session",
  "account",
  "verification",
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
});

async function verifyAuthSchema() {
  try {
    console.log("Verifying EduManage database...\n");

    const database = await pool.query(
      "SELECT current_database() AS name"
    );

    console.log("Database:", database.rows[0].name);
    console.log("--------------------------------");

    const result = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
       AND table_name = ANY($1::text[])`,
      [requiredTables]
    );

    const existingTables = new Set(
      result.rows.map((row) => row.table_name)
    );

    for (const table of requiredTables) {
      console.log(
        `${existingTables.has(table) ? "OK" : "MISSING"} - ${table}`
      );
    }

    console.log("--------------------------------");

    console.log(
      `Found ${existingTables.size} of ${requiredTables.length} tables.`
    );

    const authColumns = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
       AND table_name = 'user'`
    );

    const userColumns = new Set(
      authColumns.rows.map((row) => row.column_name)
    );

    const requiredUserColumns = [
      "id",
      "name",
      "email",
      "role",
      "banned",
      "ban_reason",
      "ban_expires",
    ];

    const missingColumns = requiredUserColumns.filter(
      (column) => !userColumns.has(column)
    );

    if (missingColumns.length > 0) {
      throw new Error(
        `Missing Better Auth user columns: ${missingColumns.join(", ")}`
      );
    }

    if (existingTables.size !== requiredTables.length) {
      throw new Error("Some database tables are missing.");
    }

    console.log("Better Auth user fields: VERIFIED");
    console.log("All database tables verified successfully!");
  } catch (error) {
    console.error("\nDatabase verification failed:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

verifyAuthSchema();
