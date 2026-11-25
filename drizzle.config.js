
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL_DIRECT) {
  throw new Error("DATABASE_URL_DIRECT is missing.");
}

export default defineConfig({
  schema: [
    "./src/db/schema.js",
    "./src/db/auth-schema.js",
  ],

  out: "./drizzle",

  dialect: "postgresql",

  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT,
  },

  verbose: true,
  strict: true,
});
