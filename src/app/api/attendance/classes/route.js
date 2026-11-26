
import { and, eq, asc } from "drizzle-orm";

import { db } from "@/db";

import {
  schoolClasses,
  classSections,
  teacherAssignments,
} from "@/db/schema";

import { requirePermission } from "@/lib/auth/require-permission";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    // 1. Verify authentication and attendance permission.
    const access = await requirePermission(
      request,
      "attendance",
      "read"
    );

    if (!access.authorized) {
      return access.response;
    }

    const { user } = access;

    if (!["superAdmin", "principal", "teacher"].includes(user.role)) {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to access attendance classes.",
        },
        { status: 403 }
      );
    }

    // 2. Read academic year.
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear");

    if (
      user.role === "teacher" &&
      (!academicYear ||
        academicYear.length > 20 ||
        !/^\d{4}(-\d{4})?$/.test(academicYear))
    ) {
      return Response.json(
        {
          success: false,
          message: "A valid academic year is required.",
        },
        { status: 400 }
      );
    }

    // 3. Retrieve active classes and sections.
    let rows;

    if (user.role === "teacher") {
      // Teachers can only see sections assigned to them.
      rows = await db
        .select({
          id: schoolClasses.id,
          name: schoolClasses.name,
          numericOrder: schoolClasses.numericOrder,
          isActive: schoolClasses.isActive,
          sectionId: classSections.id,
          sectionName: classSections.name,
          capacity: classSections.capacity,
          sectionIsActive: classSections.isActive,
        })
        .from(schoolClasses)
        .innerJoin(
          classSections,
          and(
            eq(classSections.classId, schoolClasses.id),
            eq(classSections.isActive, true)
          )
        )
        .innerJoin(
          teacherAssignments,
          and(
            eq(
              teacherAssignments.classSectionId,
              classSections.id
            ),
            eq(teacherAssignments.teacherUserId, user.id),
            eq(teacherAssignments.academicYear, academicYear),
            eq(teacherAssignments.isActive, true)
          )
        )
        .where(eq(schoolClasses.isActive, true))
        .orderBy(
          asc(schoolClasses.numericOrder),
          asc(classSections.name)
        );
    } else {
      // Administrators can see every active class and section.
      rows = await db
        .select({
          id: schoolClasses.id,
          name: schoolClasses.name,
          numericOrder: schoolClasses.numericOrder,
          isActive: schoolClasses.isActive,
          sectionId: classSections.id,
          sectionName: classSections.name,
          capacity: classSections.capacity,
          sectionIsActive: classSections.isActive,
        })
        .from(schoolClasses)
        .leftJoin(
          classSections,
          and(
            eq(classSections.classId, schoolClasses.id),
            eq(classSections.isActive, true)
          )
        )
        .where(eq(schoolClasses.isActive, true))
        .orderBy(
          asc(schoolClasses.numericOrder),
          asc(classSections.name)
        );
    }

    // 4. Group sections under their respective classes.
    const classMap = new Map();

    for (const row of rows) {
      if (!classMap.has(row.id)) {
        classMap.set(row.id, {
          id: row.id,
          name: row.name,
          numericOrder: row.numericOrder,
          isActive: row.isActive,
          sections: [],
        });
      }

      if (row.sectionId) {
        classMap.get(row.id).sections.push({
          id: row.sectionId,
          name: row.sectionName,
          capacity: row.capacity,
          isActive: row.sectionIsActive,
        });
      }
    }

    return Response.json({
      success: true,
      data: [...classMap.values()],
    });
  } catch (error) {
    console.error("Get attendance classes error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load attendance classes.",
      },
      { status: 500 }
    );
  }
}
