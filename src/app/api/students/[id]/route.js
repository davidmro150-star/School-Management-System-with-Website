
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";

import {
  students,
  studentEnrollments,
  studentGuardians,
  studentAddresses,
  studentEmergencyContacts,
  classSections,
  schoolClasses,
  teacherAssignments,
} from "@/db/schema";

import { requirePermission } from "@/lib/auth/require-permission";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const permission = await requirePermission(
      request,
      "students",
      "read"
    );

    if (!permission.authorized) {
      return permission.response;
    }

    const user = permission.user;
    const { id } = await params;

    if (!id) {
      return Response.json(
        { success: false, message: "Student ID is required." },
        { status: 400 }
      );
    }

    // Student accounts must use a separate own-profile endpoint.
    if (user.role === "student") {
      return Response.json(
        { success: false, message: "Access denied." },
        { status: 403 }
      );
    }

    const [student] = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.id, id),
          isNull(students.deletedAt)
        )
      )
      .limit(1);

    if (!student) {
      return Response.json(
        { success: false, message: "Student not found." },
        { status: 404 }
      );
    }

    const enrollmentFields = {
      id: studentEnrollments.id,
      academicYear: studentEnrollments.academicYear,
      rollNumber: studentEnrollments.rollNumber,
      isActive: studentEnrollments.isActive,
      enrolledAt: studentEnrollments.enrolledAt,
      classSectionId: classSections.id,
      sectionName: classSections.name,
      classId: schoolClasses.id,
      className: schoolClasses.name,
    };

    let enrollments;

    if (user.role === "teacher") {
      // Teachers may only view students in their assigned sections.
      enrollments = await db
        .select(enrollmentFields)
        .from(studentEnrollments)
        .innerJoin(
          classSections,
          eq(
            classSections.id,
            studentEnrollments.classSectionId
          )
        )
        .innerJoin(
          schoolClasses,
          eq(schoolClasses.id, classSections.classId)
        )
        .innerJoin(
          teacherAssignments,
          and(
            eq(
              teacherAssignments.classSectionId,
              studentEnrollments.classSectionId
            ),
            eq(
              teacherAssignments.academicYear,
              studentEnrollments.academicYear
            ),
            eq(teacherAssignments.teacherUserId, user.id),
            eq(teacherAssignments.isActive, true)
          )
        )
        .where(
          and(
            eq(studentEnrollments.studentId, id),
            eq(studentEnrollments.isActive, true),
            eq(teacherAssignments.isActive, true)
          )
        );
    } else {
      enrollments = await db
        .select(enrollmentFields)
        .from(studentEnrollments)
        .innerJoin(
          classSections,
          eq(
            classSections.id,
            studentEnrollments.classSectionId
          )
        )
        .innerJoin(
          schoolClasses,
          eq(schoolClasses.id, classSections.classId)
        )
        .where(eq(studentEnrollments.studentId, id));
    }

    if (user.role === "teacher" && enrollments.length === 0) {
      return Response.json(
        {
          success: false,
          message:
            "You are not assigned to any section containing this student.",
        },
        { status: 403 }
      );
    }

    const [guardian] = await db
      .select()
      .from(studentGuardians)
      .where(eq(studentGuardians.studentId, id))
      .limit(1);

    const [address] = await db
      .select()
      .from(studentAddresses)
      .where(eq(studentAddresses.studentId, id))
      .limit(1);

    const emergencyContacts = await db
      .select()
      .from(studentEmergencyContacts)
      .where(eq(studentEmergencyContacts.studentId, id));

    return Response.json({
      success: true,
      data: {
        student,
        guardian: guardian || null,
        address: address || null,
        enrollments,
        emergencyContacts,
      },
    });
  } catch (error) {
    console.error("Student details error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load student details.",
      },
      { status: 500 }
    );
  }
}
