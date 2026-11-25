
import "dotenv/config";

import { sql } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";

async function testDrizzle() {
  try {
    console.log("Testing Drizzle ORM...");

    const result = await db.execute(sql`
      SELECT
        current_database() AS database_name,
        current_user AS database_role,
        NOW() AS server_time
    `);

    const information = result.rows[0];

    console.log("\nDrizzle connection successful!");
    console.log("--------------------------------");
    console.log("Database:", information.database_name);
    console.log("Role:", information.database_role);
    console.log("Server time:", information.server_time);
    console.log("--------------------------------");
    console.log("EduManage Drizzle integration is working.");
  } catch (error) {
    console.error("Drizzle connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDrizzle();
