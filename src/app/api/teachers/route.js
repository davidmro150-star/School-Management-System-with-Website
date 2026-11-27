
import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
} from "drizzle-orm";

import { db } from "@/db";

import {
  teacherProfiles,
} from "@/db/schema";

import { user as authUser } from "@/db/auth-schema";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/auth/require-permission";

export const runtime = "nodejs";

const ALLOWED_EMPLOYMENT_STATUSES = [
  "active",
  "inactive",
  "on_leave",
  "resigned",
  "terminated",
];

const ALLOWED_GENDERS = [
  "male",
  "female",
  "other",
];

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value) {
  return getString(value) || null;
}

function isValidDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function getPaginationValue(value, fallback, maximum) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

/**
 * Supports the permission helper's usual Response-based
 * denial behavior, as used by protected API routes.
 */
async function checkPermission(request, resource, action) {
  const result = await requirePermission(
    request,
    resource,
    action
  );

  if (result instanceof Response) {
    return result;
  }

  if (result?.response instanceof Response) {
    return result.response;
  }

  if (result?.error instanceof Response) {
    return result.error;
  }

  if (result?.success === false) {
    return Response.json(
      {
        success: false,
        message: result.message || "Permission denied.",
      },
      {
        status: result.status || 403,
      }
    );
  }

  return null;
}

/**
 * GET /api/teachers
 *
 * Teacher directory.
 * Requires staff.read permission.
 */
export async function GET(request) {
  try {
    const permissionResponse = await checkPermission(
      request,
      "staff",
      "read"
    );

    if (permissionResponse) {
      return permissionResponse;
    }

    const { searchParams } = new URL(request.url);

    const search = getString(
      searchParams.get("search")
    );

    const status = getString(
      searchParams.get("status")
    );

    const page = getPaginationValue(
      searchParams.get("page"),
      1,
      1000000
    );

    const limit = getPaginationValue(
      searchParams.get("limit"),
      10,
      100
    );

    const offset = (page - 1) * limit;

    const conditions = [
      isNull(teacherProfiles.deletedAt),
    ];

    if (search) {
      const searchPattern = `%${search}%`;

      conditions.push(
        or(
          ilike(authUser.name, searchPattern),
          ilike(authUser.email, searchPattern),
          ilike(
            teacherProfiles.employeeId,
            searchPattern
          ),
          ilike(
            teacherProfiles.phone,
            searchPattern
          ),
          ilike(
            teacherProfiles.designation,
            searchPattern
          )
        )
      );
    }

    if (status && status !== "all") {
      if (
        !ALLOWED_EMPLOYMENT_STATUSES.includes(status)
      ) {
        return Response.json(
          {
            success: false,
            message: "Invalid employment status.",
          },
          { status: 400 }
        );
      }

      conditions.push(
        eq(
          teacherProfiles.employmentStatus,
          status
        )
      );
    }

    const whereCondition = and(...conditions);

    const [teachers, countResult] = await Promise.all([
      db
        .select({
          id: teacherProfiles.id,
          userId: teacherProfiles.userId,
          employeeId: teacherProfiles.employeeId,
          name: authUser.name,
          email: authUser.email,
          phone: teacherProfiles.phone,
          alternatePhone: teacherProfiles.alternatePhone,
          gender: teacherProfiles.gender,
          dateOfBirth: teacherProfiles.dateOfBirth,
          joiningDate: teacherProfiles.joiningDate,
          designation: teacherProfiles.designation,
          qualification: teacherProfiles.qualification,
          specialization: teacherProfiles.specialization,
          experienceYears: teacherProfiles.experienceYears,
          address: teacherProfiles.address,
          emergencyContactName:
            teacherProfiles.emergencyContactName,
          emergencyContactPhone:
            teacherProfiles.emergencyContactPhone,
          employmentStatus:
            teacherProfiles.employmentStatus,
          notes: teacherProfiles.notes,
          createdAt: teacherProfiles.createdAt,
          updatedAt: teacherProfiles.updatedAt,
        })
        .from(teacherProfiles)
        .innerJoin(
          authUser,
          eq(teacherProfiles.userId, authUser.id)
        )
        .where(whereCondition)
        .orderBy(desc(teacherProfiles.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({
          total: count(),
        })
        .from(teacherProfiles)
        .innerJoin(
          authUser,
          eq(teacherProfiles.userId, authUser.id)
        )
        .where(whereCondition),
    ]);

    const total = Number(countResult[0]?.total || 0);

    return Response.json({
      success: true,
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/teachers error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load teacher directory.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teachers
 *
 * Creates a Better Auth teacher account
 * and its corresponding teacher profile.
 *
 * Requires staff.create permission.
 */
export async function POST(request) {
  let createdUserId = null;

  try {
    const permissionResponse = await checkPermission(
      request,
      "staff",
      "create"
    );

    if (permissionResponse) {
      return permissionResponse;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const name = getString(body.name);
    const email = getString(body.email).toLowerCase();
    const password = getString(body.password);

    const employeeId = getString(body.employeeId);
    const phone = getString(body.phone);

    const alternatePhone = optionalString(
      body.alternatePhone
    );

    const gender = optionalString(body.gender);

    const dateOfBirth = optionalString(
      body.dateOfBirth
    );

    const joiningDate = getString(
      body.joiningDate
    );

    const designation =
      getString(body.designation) || "Teacher";

    const qualification = optionalString(
      body.qualification
    );

    const specialization = optionalString(
      body.specialization
    );

    const experienceYears =
      body.experienceYears === undefined ||
      body.experienceYears === null ||
      body.experienceYears === ""
        ? 0
        : Number(body.experienceYears);

    const address = optionalString(body.address);

    const emergencyContactName = optionalString(
      body.emergencyContactName
    );

    const emergencyContactPhone = optionalString(
      body.emergencyContactPhone
    );

    const employmentStatus =
      getString(body.employmentStatus) || "active";

    const notes = optionalString(body.notes);

    // -------------------------------------------------
    // 1. Required field validation
    // -------------------------------------------------

    if (
      !name ||
      !email ||
      !password ||
      !employeeId ||
      !phone ||
      !joiningDate
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Name, email, password, employee ID, phone and joining date are required.",
        },
        { status: 400 }
      );
    }

    if (name.length > 150) {
      return Response.json(
        {
          success: false,
          message: "Name cannot exceed 150 characters.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 255
    ) {
      return Response.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (password.length < 12 || password.length > 128) {
      return Response.json(
        {
          success: false,
          message:
            "Password must contain between 12 and 128 characters.",
        },
        { status: 400 }
      );
    }

    if (employeeId.length > 50) {
      return Response.json(
        {
          success: false,
          message: "Employee ID cannot exceed 50 characters.",
        },
        { status: 400 }
      );
    }

    if (phone.length > 30) {
      return Response.json(
        {
          success: false,
          message: "Phone number cannot exceed 30 characters.",
        },
        { status: 400 }
      );
    }

    if (!isValidDate(joiningDate)) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid joining date.",
        },
        { status: 400 }
      );
    }

    if (dateOfBirth && !isValidDate(dateOfBirth)) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid date of birth.",
        },
        { status: 400 }
      );
    }

    if (
      gender &&
      !ALLOWED_GENDERS.includes(gender.toLowerCase())
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid gender value.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(experienceYears) ||
      experienceYears < 0 ||
      experienceYears > 60
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Experience must be a whole number between 0 and 60.",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_EMPLOYMENT_STATUSES.includes(
        employmentStatus
      )
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid employment status.",
        },
        { status: 400 }
      );
    }

    if (
      designation.length > 100 ||
      (qualification && qualification.length > 180) ||
      (specialization && specialization.length > 180)
    ) {
      return Response.json(
        {
          success: false,
          message: "One or more profile fields are too long.",
        },
        { status: 400 }
      );
    }

    if (
      (alternatePhone && alternatePhone.length > 30) ||
      (emergencyContactPhone &&
        emergencyContactPhone.length > 30) ||
      (emergencyContactName &&
        emergencyContactName.length > 150)
    ) {
      return Response.json(
        {
          success: false,
          message: "One or more contact fields are too long.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 2. Check for duplicate employee ID
    // -------------------------------------------------

    const existingEmployee = await db
      .select({
        id: teacherProfiles.id,
      })
      .from(teacherProfiles)
      .where(
        and(
          eq(
            teacherProfiles.employeeId,
            employeeId
          ),
          isNull(teacherProfiles.deletedAt)
        )
      )
      .limit(1);

    if (existingEmployee.length > 0) {
      return Response.json(
        {
          success: false,
          message: "This employee ID is already in use.",
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------
    // 3. Check whether the email already exists
    // -------------------------------------------------

    const existingAccount = await db
      .select({
        id: authUser.id,
      })
      .from(authUser)
      .where(eq(authUser.email, email))
      .limit(1);

    if (existingAccount.length > 0) {
      return Response.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------
    // 4. Create the Better Auth account
    //
    // Important:
    // - The role is always teacher.
    // - The client cannot choose a role.
    // - Do not forward request headers or session.
    // -------------------------------------------------

    const accountResult = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role: "teacher",
      },
    });

    createdUserId = accountResult?.user?.id;

    if (!createdUserId) {
      throw new Error(
        "Teacher account creation did not return a user ID."
      );
    }

    // -------------------------------------------------
    // 5. Create the teacher employment profile
    // -------------------------------------------------

    const [profile] = await db
      .insert(teacherProfiles)
      .values({
        userId: createdUserId,
        employeeId,
        phone,
        alternatePhone,
        gender: gender ? gender.toLowerCase() : null,
        dateOfBirth,
        joiningDate,
        designation,
        qualification,
        specialization,
        experienceYears,
        address,
        emergencyContactName,
        emergencyContactPhone,
        employmentStatus,
        notes,
      })
      .returning({
        id: teacherProfiles.id,
        userId: teacherProfiles.userId,
        employeeId: teacherProfiles.employeeId,
        phone: teacherProfiles.phone,
        joiningDate: teacherProfiles.joiningDate,
        designation: teacherProfiles.designation,
        employmentStatus:
          teacherProfiles.employmentStatus,
        createdAt: teacherProfiles.createdAt,
      });

    return Response.json(
      {
        success: true,
        message: "Teacher created successfully.",
        data: {
          ...profile,
          name,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/teachers error:", error);

    // -------------------------------------------------
    // 6. Compensating cleanup
    //
    // If profile creation fails after the Better Auth
    // account was created, remove that account.
    // Related Better Auth records use cascading FKs.
    // -------------------------------------------------

    if (createdUserId) {
      try {
        await db
          .delete(authUser)
          .where(eq(authUser.id, createdUserId));
      } catch (cleanupError) {
        console.error(
          "Teacher account cleanup failed:",
          cleanupError
        );
      }
    }

    const databaseCode = error?.code;

    if (databaseCode === "23505") {
      return Response.json(
        {
          success: false,
          message:
            "The employee ID or email is already in use.",
        },
        { status: 409 }
      );
    }

    const errorMessage =
      typeof error?.message === "string"
        ? error.message
        : "";

    if (
      errorMessage.toLowerCase().includes("already exists") ||
      errorMessage.toLowerCase().includes("already registered")
    ) {
      return Response.json(
        {
          success: false,
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        message: "Unable to create teacher. Please try again.",
      },
      { status: 500 }
    );
  }
}
