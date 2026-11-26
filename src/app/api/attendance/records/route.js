
import {
  and,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";

import { db } from "@/db";

import {
  students,
  studentEnrollments,
  classSections,
  attendanceSessions,
  attendanceRecords,
} from "@/db/schema";

import { requirePermission } from "@/lib/auth/require-permission";
import { hasTeacherAssignment } from "@/lib/auth/require-teacher-assignment";

export const runtime = "nodejs";

const validStatuses = [
  "present",
  "absent",
  "late",
  "excused",
];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request) {
  try {
    // 1. Verify authentication.
    const access = await requirePermission(
      request,
      "attendance",
      "read"
    );

    if (!access.authorized) {
      return access.response;
    }

    const { user } = access;

    // 2. Read request body.
    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, message: "Invalid JSON request." },
        { status: 400 }
      );
    }

    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId.trim()
        : "";

    const action = body.action;
    const records = body.records;

    if (!uuidPattern.test(sessionId)) {
      return Response.json(
        { success: false, message: "Invalid attendance session ID." },
        { status: 400 }
      );
    }

    if (!["save", "submit"].includes(action)) {
      return Response.json(
        { success: false, message: "Action must be save or submit." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(records) ||
      records.length === 0 ||
      records.length > 1000
    ) {
      return Response.json(
        { success: false, message: "Provide between 1 and 1000 attendance records." },
        { status: 400 }
      );
    }

    // 3. Validate every attendance record.
    const submittedStudentIds = new Set();

    for (const record of records) {
      if (
        !record ||
        typeof record !== "object" ||
        !uuidPattern.test(record.studentId || "")
      ) {
        return Response.json(
          { success: false, message: "Invalid student ID in attendance records." },
          { status: 400 }
        );
      }

      if (!validStatuses.includes(record.status)) {
        return Response.json(
          { success: false, message: "Invalid attendance status." },
          { status: 400 }
        );
      }

      if (submittedStudentIds.has(record.studentId)) {
        return Response.json(
          { success: false, message: "Duplicate student in attendance records." },
          { status: 400 }
        );
      }

      submittedStudentIds.add(record.studentId);

      if (
        record.remarks !== undefined &&
        record.remarks !== null &&
        (
          typeof record.remarks !== "string" ||
          record.remarks.length > 500
        )
      ) {
        return Response.json(
          { success: false, message: "Remarks cannot exceed 500 characters." },
          { status: 400 }
        );
      }
    }

    // 4. Start a database transaction.
    const result = await db.transaction(async (tx) => {
      // Lock the session while attendance is being updated.
      const [session] = await tx
        .select()
        .from(attendanceSessions)
        .where(eq(attendanceSessions.id, sessionId))
        .for("update");

      if (!session) {
        return {
          error: "SESSION_NOT_FOUND",
        };
      }

      // 5. Check role-specific permission.
    const requiredAction =
    user.role === "principal" || session.status === "submitted"
    ? "correct"
    : "mark";

      const permission = await requirePermission(
        request,
        "attendance",
        requiredAction
      );

      if (!permission.authorized) {
        return {
          error: "FORBIDDEN",
          response: permission.response,
        };
      }

      // 6. Teachers must still be assigned to this section.
      if (user.role === "teacher") {
        const assigned = await hasTeacherAssignment(
          user.id,
          session.classSectionId,
          session.academicYear
        );

        if (!assigned) {
          return {
            error: "NOT_ASSIGNED",
          };
        }
      }

      // 7. Verify that the section is active.
      const [section] = await tx
        .select({ id: classSections.id })
        .from(classSections)
        .where(
          and(
            eq(classSections.id, session.classSectionId),
            eq(classSections.isActive, true)
          )
        )
        .limit(1);

      if (!section) {
        return {
          error: "SECTION_INACTIVE",
        };
      }

      // 8. Only actively enrolled students can receive attendance.
      const enrolledStudents = await tx
        .select({
          studentId: students.id,
        })
        .from(studentEnrollments)
        .innerJoin(
          students,
          eq(studentEnrollments.studentId, students.id)
        )
        .where(
          and(
            eq(
              studentEnrollments.classSectionId,
              session.classSectionId
            ),
            eq(
              studentEnrollments.academicYear,
              session.academicYear
            ),
            eq(studentEnrollments.isActive, true),
            eq(students.status, "active"),
            isNull(students.deletedAt)
          )
        );

      const enrolledIds = new Set(
        enrolledStudents.map((student) => student.studentId)
      );

      for (const record of records) {
        if (!enrolledIds.has(record.studentId)) {
          return {
            error: "INVALID_ENROLLMENT",
          };
        }
      }

      // 9. Save or update attendance records.
     
      // 9. Check submission completeness BEFORE writing records.
      if (action === "submit") {
        const existingRecords = await tx
          .select({
            studentId: attendanceRecords.studentId,
          })
          .from(attendanceRecords)
          .where(
            eq(attendanceRecords.sessionId, session.id)
          );

        const recordedIds = new Set([
          ...existingRecords.map((record) => record.studentId),
          ...records.map((record) => record.studentId),
        ]);

        const missingStudents = enrolledStudents.filter(
          (student) => !recordedIds.has(student.studentId)
        );

        if (missingStudents.length > 0) {
          return {
            error: "ATTENDANCE_INCOMPLETE",
            missingCount: missingStudents.length,
          };
        }
      }

      // 10. Save or update attendance records.
      for (const record of records) {
        await tx
          .insert(attendanceRecords)
          .values({
            sessionId: session.id,
            studentId: record.studentId,
            status: record.status,
            remarks: record.remarks?.trim() || null,
          })
          .onConflictDoUpdate({
            target: [
              attendanceRecords.sessionId,
              attendanceRecords.studentId,
            ],
            set: {
              status: record.status,
              remarks: record.remarks?.trim() || null,
              updatedAt: new Date(),
            },
          });
      }


      // 10. Submit only when every enrolled student has attendance.
      if (action === "submit") {
        const existingRecords = await tx
          .select({
            studentId: attendanceRecords.studentId,
          })
          .from(attendanceRecords)
          .where(
            eq(attendanceRecords.sessionId, session.id)
          );

        const recordedIds = new Set(
          existingRecords.map((record) => record.studentId)
        );

        const missingStudents = enrolledStudents.filter(
          (student) => !recordedIds.has(student.studentId)
        );

        if (missingStudents.length > 0) {
          return {
            error: "ATTENDANCE_INCOMPLETE",
            missingCount: missingStudents.length,
          };
        }
      }

      // 11. Update the session status.
      const updateValues = {
        updatedAt: new Date(),
      };

      if (action === "submit" && session.status === "draft") {
        updateValues.status = "submitted";
        updateValues.submittedAt = new Date();
      }

      const [updatedSession] = await tx
        .update(attendanceSessions)
        .set(updateValues)
        .where(eq(attendanceSessions.id, session.id))
        .returning();

      return {
        success: true,
        session: updatedSession,
        savedCount: records.length,
      };
    });

    // 12. Handle transaction results.
    if (result.error === "SESSION_NOT_FOUND") {
      return Response.json(
        { success: false, message: "Attendance session not found." },
        { status: 404 }
      );
    }

    if (result.error === "FORBIDDEN") {
      return result.response;
    }

    if (result.error === "NOT_ASSIGNED") {
      return Response.json(
        { success: false, message: "You are not assigned to this class section." },
        { status: 403 }
      );
    }

    if (result.error === "SECTION_INACTIVE") {
      return Response.json(
        { success: false, message: "This class section is inactive." },
        { status: 400 }
      );
    }

    if (result.error === "INVALID_ENROLLMENT") {
      return Response.json(
        { success: false, message: "One or more students are not actively enrolled in this class." },
        { status: 400 }
      );
    }

    if (result.error === "ATTENDANCE_INCOMPLETE") {
      return Response.json(
        {
          success: false,
          message: "Attendance is incomplete. Mark every enrolled student before submitting.",
          missingCount: result.missingCount,
        },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message:
        action === "submit"
          ? "Attendance submitted successfully."
          : "Attendance saved as draft successfully.",
      data: {
        session: result.session,
        savedCount: result.savedCount,
      },
    });
  } catch (error) {
    console.error("Save attendance error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to save attendance.",
      },
      { status: 500 }
    );
  }
}
