
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

async function verifyTable() {
  try {
    const tableResult = await pool.query(`
      SELECT COUNT(*)::int AS column_count
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'website_pages';
    `);

    const enumResult = await pool.query(`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'website_page_status'
      ORDER BY e.enumsortorder;
    `);

    const columnCount = tableResult.rows[0].column_count;

    console.log("CMS DATABASE VERIFICATION");
    console.log("--------------------------------");
    console.log("Website pages table:", columnCount > 0 ? "EXISTS" : "MISSING");
    console.log("Columns:", columnCount);
    console.log(
      "Page status values:",
      enumResult.rows.map((row) => row.enumlabel).join(", ")
    );

    if (columnCount === 13 && enumResult.rows.length === 3) {
      console.log("--------------------------------");
      console.log("CMS DATABASE TABLE VERIFIED!");
    } else {
      throw new Error("CMS table verification incomplete.");
    }
  } catch (error) {
    console.error("Verification failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

verifyTable();
