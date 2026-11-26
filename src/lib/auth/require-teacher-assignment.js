
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { teacherAssignments } from "@/db/schema";

/**
 * Check whether a teacher is assigned to a class section
 * for the requested academic year.
 */
export async function hasTeacherAssignment(
  teacherUserId,
  classSectionId,
  academicYear
) {
  if (!teacherUserId || !classSectionId || !academicYear) {
    return false;
  }

  const [assignment] = await db
    .select({
      id: teacherAssignments.id,
    })
    .from(teacherAssignments)
    .where(
      and(
        eq(teacherAssignments.teacherUserId, teacherUserId),
        eq(teacherAssignments.classSectionId, classSectionId),
        eq(teacherAssignments.academicYear, academicYear),
        eq(teacherAssignments.isActive, true)
      )
    )
    .limit(1);

  return Boolean(assignment);
}
