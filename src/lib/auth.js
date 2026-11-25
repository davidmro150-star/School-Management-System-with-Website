
import "dotenv/config";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin as adminPlugin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "../db/index.js";

import {
  ac,
  roleDefinitions,
} from "./auth/permissions.js";

const requiredVariables = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`${variable} is missing from .env`);
  }
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
    schema,
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
