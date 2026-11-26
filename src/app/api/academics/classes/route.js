
import { eq, asc } from "drizzle-orm";

import { db } from "@/db";
import { schoolClasses, classSections } from "@/db/schema";
import { requirePermission } from "@/lib/auth/require-permission";

export const runtime = "nodejs";

// GET: Retrieve classes and their sections.
export async function GET(request) {
  try {
    const access = await requirePermission(
      request,
      "academics",
      "read"
    );

    if (!access.authorized) {
      return access.response;
    }

    if (!["superAdmin", "principal"].includes(access.user.role)) {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to view classes.",
        },
        { status: 403 }
      );
    }

    const rows = await db
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
        eq(schoolClasses.id, classSections.classId)
      )
      .orderBy(
        asc(schoolClasses.numericOrder),
        asc(classSections.name)
      );

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
    console.error("Get classes error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load classes.",
      },
      { status: 500 }
    );
  }
}

// POST: Create a class.
export async function POST(request) {
  try {
    const access = await requirePermission(
      request,
      "academics",
      "create"
    );

    if (!access.authorized) {
      return access.response;
    }

    if (!["superAdmin", "principal"].includes(access.user.role)) {
      return Response.json(
        {
          success: false,
          message: "You do not have permission to create classes.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const numericOrder = Number(body?.numericOrder);

    if (
      !Number.isInteger(numericOrder) ||
      numericOrder < 6 ||
      numericOrder > 10
    ) {
      return Response.json(
        {
          success: false,
          message: "Only Class 6 to Class 10 can be created.",
        },
        { status: 400 }
      );
    }

    const name = `Class ${numericOrder}`;

    const [newClass] = await db
      .insert(schoolClasses)
      .values({
        name,
        numericOrder,
      })
      .onConflictDoNothing({
        target: schoolClasses.name,
      })
      .returning();

    if (!newClass) {
      return Response.json(
        {
          success: false,
          message: `${name} already exists.`,
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: true,
        message: `${name} created successfully.`,
        data: newClass,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create class error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to create class.",
      },
      { status: 500 }
    );
  }
}
