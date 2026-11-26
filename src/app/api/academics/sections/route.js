
import { and, eq, asc } from "drizzle-orm";

import { db } from "@/db";
import { schoolClasses, classSections } from "@/db/schema";
import { requirePermission } from "@/lib/auth/require-permission";

export const runtime = "nodejs";

const allowedRoles = ["superAdmin", "principal"];

function validUUID(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

// GET: List sections belonging to a class.
export async function GET(request) {
  try {
    const access = await requirePermission(
      request,
      "academics",
      "read"
    );

    if (!access.authorized) return access.response;

    if (!allowedRoles.includes(access.user.role)) {
      return Response.json(
        { success: false, message: "You cannot view class sections." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!validUUID(classId)) {
      return Response.json(
        { success: false, message: "Valid class ID is required." },
        { status: 400 }
      );
    }

    const sections = await db
      .select({
        id: classSections.id,
        classId: classSections.classId,
        name: classSections.name,
        capacity: classSections.capacity,
        isActive: classSections.isActive,
      })
      .from(classSections)
      .where(eq(classSections.classId, classId))
      .orderBy(asc(classSections.name));

    return Response.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error("Get class sections error:", error);

    return Response.json(
      { success: false, message: "Unable to load class sections." },
      { status: 500 }
    );
  }
}

// POST: Create a section or group under a class.
export async function POST(request) {
  try {
    const access = await requirePermission(
      request,
      "academics",
      "create"
    );

    if (!access.authorized) return access.response;

    if (!allowedRoles.includes(access.user.role)) {
      return Response.json(
        { success: false, message: "You cannot create class sections." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const classId = body?.classId;
    const name =
      typeof body?.name === "string" ? body.name.trim() : "";
    const capacity =
      body?.capacity === undefined ? 50 : Number(body.capacity);

    if (!validUUID(classId)) {
      return Response.json(
        { success: false, message: "Valid class ID is required." },
        { status: 400 }
      );
    }

    if (!name || name.length > 50) {
      return Response.json(
        {
          success: false,
          message: "Section name must contain 1 to 50 characters.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
      return Response.json(
        {
          success: false,
          message: "Capacity must be between 1 and 1000.",
        },
        { status: 400 }
      );
    }

    const [parentClass] = await db
      .select({
        id: schoolClasses.id,
        isActive: schoolClasses.isActive,
      })
      .from(schoolClasses)
      .where(eq(schoolClasses.id, classId))
      .limit(1);

    if (!parentClass || !parentClass.isActive) {
      return Response.json(
        { success: false, message: "Active class not found." },
        { status: 404 }
      );
    }

    const [newSection] = await db
      .insert(classSections)
      .values({
        classId,
        name,
        capacity,
      })
      .onConflictDoNothing({
        target: [classSections.classId, classSections.name],
      })
      .returning();

    if (!newSection) {
      return Response.json(
        {
          success: false,
          message: "This section name already exists in the selected class.",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: true,
        message: `${name} section created successfully.`,
        data: newSection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create class section error:", error);

    return Response.json(
      { success: false, message: "Unable to create class section." },
      { status: 500 }
    );
  }
}

// PATCH: Update a section or activate/deactivate it.
export async function PATCH(request) {
  try {
    const access = await requirePermission(
      request,
      "academics",
      "update"
    );

    if (!access.authorized) return access.response;

    if (!allowedRoles.includes(access.user.role)) {
      return Response.json(
        { success: false, message: "You cannot update class sections." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const sectionId = body?.sectionId;

    if (!validUUID(sectionId)) {
      return Response.json(
        { success: false, message: "Valid section ID is required." },
        { status: 400 }
      );
    }

    const updates = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return Response.json(
          { success: false, message: "Invalid section name." },
          { status: 400 }
        );
      }

      const name = body.name.trim();

      if (!name || name.length > 50) {
        return Response.json(
          {
            success: false,
            message: "Section name must contain 1 to 50 characters.",
          },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if (body.capacity !== undefined) {
      const capacity = Number(body.capacity);

      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
        return Response.json(
          {
            success: false,
            message: "Capacity must be between 1 and 1000.",
          },
          { status: 400 }
        );
      }

      updates.capacity = capacity;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return Response.json(
          { success: false, message: "Invalid active status." },
          { status: 400 }
        );
      }

      updates.isActive = body.isActive;
    }

    if (Object.keys(updates).length === 1) {
      return Response.json(
        { success: false, message: "No changes were provided." },
        { status: 400 }
      );
    }

    const [updatedSection] = await db
      .update(classSections)
      .set(updates)
      .where(eq(classSections.id, sectionId))
      .returning();

    if (!updatedSection) {
      return Response.json(
        { success: false, message: "Section not found." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Section updated successfully.",
      data: updatedSection,
    });
  } catch (error) {
    if (error?.code === "23505") {
      return Response.json(
        {
          success: false,
          message: "This section name already exists in the selected class.",
        },
        { status: 409 }
      );
    }

    console.error("Update class section error:", error);

    return Response.json(
      { success: false, message: "Unable to update class section." },
      { status: 500 }
    );
  }
}
