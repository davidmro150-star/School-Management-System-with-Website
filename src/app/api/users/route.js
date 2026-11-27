
import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
} from "drizzle-orm";

import { db } from "@/db/index.js";
import { user } from "@/db/auth-schema.js";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/auth/require-permission";

const ALLOWED_ROLES = [
  "principal",
  "teacher",
  "student",
  "accountant",
];

// GET: List and search user accounts.
export async function GET(request) {
  try {
    const permission = await requirePermission(
      request,
      "userManagement",
      "read"
    );

    if (!permission.authorized) {
      return permission.response;
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(searchParams.get("limit") || "20", 10) || 20
      )
    );

    const search = (searchParams.get("search") || "").trim();
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
      );
    }

    if (ALLOWED_ROLES.includes(role)) {
      conditions.push(eq(user.role, role));
    }

    if (status === "active") {
      conditions.push(
        or(eq(user.banned, false), isNull(user.banned))
      );
    } else if (status === "inactive") {
      conditions.push(eq(user.banned, true));
    }

    const whereClause = conditions.length
      ? and(...conditions)
      : undefined;

    const offset = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          banned: user.banned,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(whereClause)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ total: count() })
        .from(user)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.total || 0);

    return Response.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/users error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to retrieve user accounts.",
      },
      { status: 500 }
    );
  }
}

// POST: Create a new user account.
export async function POST(request) {
  try {
    const permission = await requirePermission(
      request,
      "userManagement",
      "create"
    );

    if (!permission.authorized) {
      return permission.response;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message: "Invalid request data.",
        },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    const role =
      typeof body.role === "string" ? body.role.trim() : "";

    // Validate name.
    if (name.length < 2 || name.length > 100) {
      return Response.json(
        {
          success: false,
          message: "Name must contain between 2 and 100 characters.",
        },
        { status: 400 }
      );
    }

    // Validate email.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email) || email.length > 254) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    // Validate password.
    if (password.length < 12 || password.length > 128) {
      return Response.json(
        {
          success: false,
          message: "Password must contain 12 to 128 characters.",
        },
        { status: 400 }
      );
    }

    // Only the four permitted account roles can be created.
    if (!ALLOWED_ROLES.includes(role)) {
      return Response.json(
        {
          success: false,
          message: "Invalid role. Super Admin accounts cannot be created here.",
        },
        { status: 400 }
      );
    }

    // Check for an existing email address.
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "An account with this email address already exists.",
        },
        { status: 409 }
      );
    }

    // Create the account through Better Auth.
    // Intentionally do not forward request headers or session credentials.
    // This internal call is protected by the Super Admin permission check above.
    const result = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role,
      },
    });

    const createdUser = result?.user ?? result;

    if (!createdUser?.id) {
      throw new Error("Better Auth did not return the created user.");
    }

    return Response.json(
      {
        success: true,
        message: "User account created successfully.",
        data: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          emailVerified: createdUser.emailVerified,
          createdAt: createdUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = String(error?.message || "");

    if (
      errorMessage.toLowerCase().includes("already") &&
      errorMessage.toLowerCase().includes("email")
    ) {
      return Response.json(
        {
          success: false,
          message: "An account with this email address already exists.",
        },
        { status: 409 }
      );
    }

    console.error("POST /api/users error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to create the user account.",
      },
      { status: 500 }
    );
  }
}
