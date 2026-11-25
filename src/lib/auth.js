
import "dotenv/config";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin as adminPlugin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { db } from "../db/index.js";

import {
  ac,
  roleDefinitions,
} from "./auth/permissions.js";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is missing from .env");
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is missing from .env");
}

export const auth = betterAuth({
  appName: "EduManage",

  secret: process.env.BETTER_AUTH_SECRET,

  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
  ],

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },

  plugins: [
    adminPlugin({
      ac,
      roles: roleDefinitions,
      adminRoles: ["superAdmin"],
      defaultRole: "student",
    }),

    nextCookies(),
  ],
});
