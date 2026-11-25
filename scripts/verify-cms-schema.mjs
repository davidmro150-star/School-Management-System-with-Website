
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
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
});

async function verifyCmsSchema() {
  try {
    console.log("Checking EduManage CMS database...\n");

    const databaseResult = await pool.query(
      "SELECT current_database() AS database_name"
    );

    console.log("Database:", databaseResult.rows[0].database_name);
    console.log("--------------------------------");

    const result = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );

    const existingTables = result.rows.map(
      (row) => row.table_name
    );

    for (const table of requiredTables) {
      const exists = existingTables.includes(table);

      console.log(
        `${exists ? "OK" : "MISSING"} - ${table}`
      );
    }

    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table)
    );

    console.log("--------------------------------");
    console.log(
      `Found ${requiredTables.length - missingTables.length} of ${requiredTables.length} required CMS tables.`
    );

    if (missingTables.length > 0) {
      throw new Error(
        `Missing tables: ${missingTables.join(", ")}`
      );
    }

    console.log("\nAll CMS tables verified successfully!");
  } catch (error) {
    console.error("\nCMS verification failed:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

verifyCmsSchema();
