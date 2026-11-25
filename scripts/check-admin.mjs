
import { eq, sql } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";
import { user, account } from "../src/db/auth-schema.js";

const email = "davidmro150@gmail.com";

try {
  const [admin] = await db
    .select({
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!admin) {
    console.log("Admin user not found.");
    process.exitCode = 1;
  } else {
    console.log("Admin user:", {
      email: admin.email,
      role: admin.role,
      emailVerified: admin.emailVerified,
    });

    const credentials = await db
      .select({
        providerId: account.providerId,
        hasPassword: sql`(${account.password} IS NOT NULL)`,
      })
      .from(account)
      .where(eq(account.userId, admin.id));

    console.log("Authentication credentials:", credentials);
  }
} catch (error) {
  console.error("Verification failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
