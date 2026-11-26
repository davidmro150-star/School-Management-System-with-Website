
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  classSections,
  attendanceSessions,
} from "@/db/schema";

import { requirePermission } from "@/lib/auth/require-permission";
import { hasTeacherAssignment } from "@/lib/auth/require-teacher-assignment";

export const runtime = "nodejs";

// Validate a real YYYY-MM-DD calendar date.
function isValidDate(value) {
  if (typeof value !== "string") return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export async function POST(request) {
  try {
    // 1. Verify authentication and permission.
    const access = await requirePermission(
      request,
      "attendance",
      "mark"
    );

    if (!access.authorized) {
      return access.response;
    }

    const { user } = access;

    // 2. Read and validate request data.
    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, message: "Invalid JSON request." },
        { status: 400 }
      );
    }

    const classSectionId =
      typeof body.classSectionId === "string"
        ? body.classSectionId.trim()
        : "";

    const sessionDate =
      typeof body.sessionDate === "string"
        ? body.sessionDate.trim()
        : "";

    const academicYear =
      typeof body.academicYear === "string"
        ? body.academicYear.trim()
        : "";

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim()
        : null;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(classSectionId)) {
      return Response.json(
        { success: false, message: "Invalid class section ID." },
        { status: 400 }
      );
    }

    if (!isValidDate(sessionDate)) {
      return Response.json(
        { success: false, message: "Please provide a valid session date." },
        { status: 400 }
      );
    }

    if (!academicYear || academicYear.length > 20) {
      return Response.json(
        { success: false, message: "Invalid academic year." },
        { status: 400 }
      );
    }

    if (notes && notes.length > 5000) {
      return Response.json(
        { success: false, message: "Notes cannot exceed 5000 characters." },
        { status: 400 }
      );
    }

    // 3. Confirm that the class section exists and is active.
    const [section] = await db
      .select({
        id: classSections.id,
      })
      .from(classSections)
      .where(
        and(
          eq(classSections.id, classSectionId),
          eq(classSections.isActive, true)
        )
      )
      .limit(1);

    if (!section) {
      return Response.json(
        {
          success: false,
          message: "Class section not found or inactive.",
        },
        { status: 404 }
      );
    }

    // 4. Teachers can only create sessions for assigned sections.
    if (user.role === "teacher") {
      const assigned = await hasTeacherAssignment(
        user.id,
        classSectionId,
        academicYear
      );

      if (!assigned) {
        return Response.json(
          {
            success: false,
            message: "You are not assigned to this class section.",
          },
          { status: 403 }
        );
      }
    }

    // 5. Create a draft attendance session.
    const [session] = await db
      .insert(attendanceSessions)
      .values({
        classSectionId,
        sessionDate,
        academicYear,
        status: "draft",
        markedByUserId: user.id,
        notes: notes || null,
      })
      .returning();

    return Response.json(
      {
        success: true,
        message: "Attendance session created successfully.",
        data: session,
      },
      { status: 201 }
    );
  } catch (error) {
    // Prevent duplicate sessions for the same section and date.
    if (error.code === "23505") {
      return Response.json(
        {
          success: false,
          message: "An attendance session already exists for this class section and date.",
        },
        { status: 409 }
      );
    }

    console.error("Create attendance session error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to create attendance session.",
      },
      { status: 500 }
    );
  }
}
