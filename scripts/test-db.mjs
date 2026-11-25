
import "dotenv/config";
import { Pool } from "pg";

async function testConnection(name, connectionString) {
  if (!connectionString) {
    throw new Error(`${name} is missing from .env`);
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  try {
    const result = await pool.query(`
      SELECT current_database() AS database_name,
             current_user AS database_role,
             NOW() AS server_time;
    `);

    console.log(`\n${name}: SUCCESS`);
    console.log("Database:", result.rows[0].database_name);
    console.log("Role:", result.rows[0].database_role);
  } catch (error) {
    console.error(`\n${name}: FAILED`);
    console.error(error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    console.log("Testing EduManage PostgreSQL connections...");

    await testConnection(
      "Pooled application connection",
      process.env.DATABASE_URL
    );

    await testConnection(
      "Direct migration connection",
      process.env.DATABASE_URL_DIRECT
    );

    console.log("\nBoth PostgreSQL connections are working!");
  } catch {
    process.exitCode = 1;
  }
}

main();
