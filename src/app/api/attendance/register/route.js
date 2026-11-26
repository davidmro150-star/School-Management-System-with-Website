
import { and, eq, isNull, asc } from "drizzle-orm";

import { db } from "@/db";

import {
  students,
  studentEnrollments,
  classSections,
  schoolClasses,
  attendanceSessions,
  attendanceRecords,
} from "@/db/schema";

import { requirePermission } from "@/lib/auth/require-permission";
import { hasTeacherAssignment } from "@/lib/auth/require-teacher-assignment";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    // 1. Verify authentication and read permission.
    const access = await requirePermission(
      request,
      "attendance",
      "read"
    );

    if (!access.authorized) {
      return access.response;
    }

    const { user } = access;

    // 2. Only administrators and teachers can access
    // a complete class attendance register.
    if (!["superAdmin", "principal", "teacher"].includes(user.role)) {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to access this class register.",
        },
        { status: 403 }
      );
    }

    // 3. Read query parameters.
    const { searchParams } = new URL(request.url);

    const classSectionId = searchParams.get("classSectionId");
    const academicYear = searchParams.get("academicYear");
    const sessionDate = searchParams.get("sessionDate");

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!classSectionId || !uuidPattern.test(classSectionId)) {
      return Response.json(
        { success: false, message: "Valid class section ID is required." },
        { status: 400 }
      );
    }

    if (
      !academicYear ||
      academicYear.length > 20 ||
      !/^\d{4}(-\d{4})?$/.test(academicYear)
    ) {
      return Response.json(
        { success: false, message: "Valid academic year is required." },
        { status: 400 }
      );
    }

    if (
      sessionDate &&
      (
        !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) ||
        Number.isNaN(Date.parse(`${sessionDate}T00:00:00.000Z`)) ||
        new Date(`${sessionDate}T00:00:00.000Z`)
          .toISOString()
          .slice(0, 10) !== sessionDate
      )
    ) {
      return Response.json(
        { success: false, message: "Invalid session date." },
        { status: 400 }
      );
    }

    // 4. Confirm that the section exists and is active.
    const [section] = await db
      .select({
        id: classSections.id,
        sectionName: classSections.name,
        className: schoolClasses.name,
      })
      .from(classSections)
      .innerJoin(
        schoolClasses,
        eq(classSections.classId, schoolClasses.id)
      )
      .where(
        and(
          eq(classSections.id, classSectionId),
          eq(classSections.isActive, true),
          eq(schoolClasses.isActive, true)
        )
      )
      .limit(1);

    if (!section) {
      return Response.json(
        { success: false, message: "Active class section not found." },
        { status: 404 }
      );
    }

    // 5. Teachers can only access assigned sections.
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

    // 6. Retrieve only actively enrolled, active students.
    const enrolledStudents = await db
      .select({
        id: students.id,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        rollNumber: studentEnrollments.rollNumber,
      })
      .from(studentEnrollments)
      .innerJoin(
        students,
        eq(studentEnrollments.studentId, students.id)
      )
      .where(
        and(
          eq(studentEnrollments.classSectionId, classSectionId),
          eq(studentEnrollments.academicYear, academicYear),
          eq(studentEnrollments.isActive, true),
          eq(students.status, "active"),
          isNull(students.deletedAt)
        )
      )
      .orderBy(
        asc(studentEnrollments.rollNumber),
        asc(students.firstName)
      );

    // 7. Find an existing session for this date, if requested.
    let session = null;
    let records = [];

    if (sessionDate) {
      const [existingSession] = await db
        .select()
        .from(attendanceSessions)
        .where(
          and(
            eq(attendanceSessions.classSectionId, classSectionId),
            eq(attendanceSessions.academicYear, academicYear),
            eq(attendanceSessions.sessionDate, sessionDate)
          )
        )
        .limit(1);

      session = existingSession || null;

      if (session) {
        records = await db
          .select({
            studentId: attendanceRecords.studentId,
            status: attendanceRecords.status,
            remarks: attendanceRecords.remarks,
          })
          .from(attendanceRecords)
          .where(eq(attendanceRecords.sessionId, session.id));
      }
    }

    const attendanceMap = new Map(
      records.map((record) => [record.studentId, record])
    );

    // 8. Combine enrolled students with their attendance status.
    const register = enrolledStudents.map((student) => {
      const attendance = attendanceMap.get(student.id);

      return {
        ...student,
        attendanceStatus: attendance?.status || null,
        remarks: attendance?.remarks || "",
      };
    });

    return Response.json({
      success: true,
      data: {
        section,
        academicYear,
        session,
        students: register,
        totalStudents: register.length,
      },
    });
  } catch (error) {
    console.error("Attendance register error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load attendance register.",
      },
      { status: 500 }
    );
  }
}
