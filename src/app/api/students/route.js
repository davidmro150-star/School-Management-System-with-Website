
import {
  and,
  countDistinct,
  desc,
  eq,
  ilike,
  isNull,
  or,
} from "drizzle-orm";

import { db } from "@/db";

import {
  students,
  studentEnrollments,
  studentGuardians,
  studentAddresses,
  studentEmergencyContacts,
  schoolClasses,
  classSections,
  teacherAssignments,
} from "@/db/schema";

import { requirePermission } from "@/lib/auth/require-permission";

export const runtime = "nodejs";

// =====================================================
// HELPERS
// =====================================================

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value) {
  return getString(value) || null;
}

function studentFields() {
  return {
    id: students.id,
    admissionNumber: students.admissionNumber,
    firstName: students.firstName,
    lastName: students.lastName,
    email: students.email,
    phone: students.phone,
    dateOfBirth: students.dateOfBirth,
    status: students.status,
    createdAt: students.createdAt,
  };
}

function hasAnyValue(values) {
  return Object.values(values).some(
    (value) => value !== null && value !== ""
  );
}

// =====================================================
// GET: LIST AND SEARCH STUDENTS
// =====================================================

export async function GET(request) {
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
    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";

    const academicYear = (
      searchParams.get("academicYear") || ""
    ).trim();

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

    const offset = (page - 1) * limit;

    if (
      status &&
      !["active", "inactive", "graduated"].includes(status)
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid student status.",
        },
        { status: 400 }
      );
    }

    // Students will use a separate own-profile endpoint.
    if (user.role === "student") {
      return Response.json(
        {
          success: false,
          message: "Student directory access is not available.",
        },
        { status: 403 }
      );
    }

    const conditions = [isNull(students.deletedAt)];

    if (status) {
      conditions.push(eq(students.status, status));
    }

    if (search) {
      const searchPattern = `%${search}%`;

      conditions.push(
        or(
          ilike(students.admissionNumber, searchPattern),
          ilike(students.firstName, searchPattern),
          ilike(students.lastName, searchPattern),
          ilike(students.email, searchPattern),
          ilike(students.phone, searchPattern)
        )
      );
    }

    // Teachers can only see students in their assigned sections.
    if (user.role === "teacher") {
      if (!/^\d{4}(-\d{4})?$/.test(academicYear)) {
        return Response.json(
          {
            success: false,
            message: "A valid academic year is required.",
          },
          { status: 400 }
        );
      }

      conditions.push(
        eq(studentEnrollments.academicYear, academicYear),
        eq(studentEnrollments.isActive, true),
        eq(teacherAssignments.teacherUserId, user.id),
        eq(teacherAssignments.academicYear, academicYear),
        eq(teacherAssignments.isActive, true)
      );

      const whereCondition = and(...conditions);

      const data = await db
        .selectDistinct(studentFields())
        .from(students)
        .innerJoin(
          studentEnrollments,
          eq(studentEnrollments.studentId, students.id)
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
            )
          )
        )
        .where(whereCondition)
        .orderBy(desc(students.createdAt))
        .limit(limit)
        .offset(offset);

      const [totalResult] = await db
        .select({
          total: countDistinct(students.id),
        })
        .from(students)
        .innerJoin(
          studentEnrollments,
          eq(studentEnrollments.studentId, students.id)
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
            )
          )
        )
        .where(whereCondition);

      const total = Number(totalResult.total);

      return Response.json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Principal, Super Admin and Accountant.
    const whereCondition = and(...conditions);

    const data = await db
      .select(studentFields())
      .from(students)
      .where(whereCondition)
      .orderBy(desc(students.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({
        total: countDistinct(students.id),
      })
      .from(students)
      .where(whereCondition);

    const total = Number(totalResult.total);

    return Response.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Student listing error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load students.",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST: REGISTER A COMPLETE STUDENT
// =====================================================

export async function POST(request) {
  try {
    // -------------------------------------------------
    // 1. PERMISSION CHECK
    // -------------------------------------------------

    const permission = await requirePermission(
      request,
      "students",
      "create"
    );

    if (!permission.authorized) {
      return permission.response;
    }

    const user = permission.user;

    // -------------------------------------------------
    // 2. READ REQUEST BODY
    // -------------------------------------------------

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message: "Invalid JSON request.",
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json(
        {
          success: false,
          message: "Invalid request data.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 3. STUDENT INFORMATION
    // -------------------------------------------------

    const admissionNumber = getString(
      body.admissionNumber
    ).toUpperCase();

    const firstName = getString(body.firstName);
    const lastName = getString(body.lastName);
    const email = getString(body.email).toLowerCase();
    const phone = getString(body.phone);
    const dateOfBirth = getString(body.dateOfBirth);

    const gender = getString(body.gender);
    const bloodGroup = getString(body.bloodGroup);
    const religion = getString(body.religion);
    const photoUrl = getString(body.photoUrl);

    const previousSchool = getString(body.previousSchool);
    const previousClass = getString(body.previousClass);

    const admissionDate = getString(body.admissionDate);

    // -------------------------------------------------
    // 4. ACADEMIC ENROLLMENT INFORMATION
    // -------------------------------------------------

    const classId = getString(body.classId);
    const classSectionId = getString(body.classSectionId);

    const academicYear = getString(body.academicYear);
    const rollNumber = getString(body.rollNumber);

    // -------------------------------------------------
    // 5. GUARDIAN INFORMATION
    // -------------------------------------------------

    const guardianData = {
      fatherName: optionalString(body.fatherName),
      fatherPhone: optionalString(body.fatherPhone),
      fatherOccupation: optionalString(body.fatherOccupation),

      motherName: optionalString(body.motherName),
      motherPhone: optionalString(body.motherPhone),
      motherOccupation: optionalString(body.motherOccupation),

      guardianName: optionalString(body.guardianName),
      guardianRelationship: optionalString(
        body.guardianRelationship
      ),
      guardianPhone: optionalString(body.guardianPhone),
    };

    // -------------------------------------------------
    // 6. ADDRESS INFORMATION
    // -------------------------------------------------

    const addressData = {
      village: optionalString(body.village),
      postOffice: optionalString(body.postOffice),
      postalCode: optionalString(body.postalCode),
      unionName: optionalString(body.unionName),
      upazila: optionalString(body.upazila),
      district: optionalString(body.district),
      presentAddress: optionalString(body.presentAddress),
      permanentAddress: optionalString(body.permanentAddress),
    };

    // -------------------------------------------------
    // 7. EMERGENCY CONTACTS
    // -------------------------------------------------

    if (
      body.emergencyContacts !== undefined &&
      !Array.isArray(body.emergencyContacts)
    ) {
      return Response.json(
        {
          success: false,
          message: "Emergency contacts must be an array.",
        },
        { status: 400 }
      );
    }

    const rawEmergencyContacts = body.emergencyContacts || [];

    if (rawEmergencyContacts.length > 10) {
      return Response.json(
        {
          success: false,
          message: "You can add a maximum of 10 emergency contacts.",
        },
        { status: 400 }
      );
    }

    const emergencyContacts = [];

    for (const contact of rawEmergencyContacts) {
      if (!contact || typeof contact !== "object" || Array.isArray(contact)) {
        return Response.json(
          {
            success: false,
            message: "Invalid emergency contact information.",
          },
          { status: 400 }
        );
      }

      const contactName = getString(contact.contactName);
      const relationship = getString(contact.relationship);
      const contactPhone = getString(contact.phone);

      // Completely empty contact rows are ignored.
      if (!contactName && !relationship && !contactPhone) {
        continue;
      }

      // Name and phone must be supplied together.
      if (!contactName || !contactPhone) {
        return Response.json(
          {
            success: false,
            message:
              "Each emergency contact must have both a name and phone number.",
          },
          { status: 400 }
        );
      }

      if (
        contactName.length > 150 ||
        relationship.length > 50 ||
        contactPhone.length > 30
      ) {
        return Response.json(
          {
            success: false,
            message: "An emergency contact field is too long.",
          },
          { status: 400 }
        );
      }

      emergencyContacts.push({
        contactName,
        relationship: relationship || null,
        phone: contactPhone,
      });
    }

    // -------------------------------------------------
    // 8. REQUIRED FIELD VALIDATION
    // -------------------------------------------------

    if (
      !admissionNumber ||
      !firstName ||
      !admissionDate ||
      !academicYear ||
      !classId ||
      !classSectionId ||
      !rollNumber
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Admission number, first name, admission date, academic year, class, section and roll number are required.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 9. FIELD LENGTH VALIDATION
    // -------------------------------------------------

    const lengthChecks = [
      [admissionNumber, 50],
      [firstName, 100],
      [lastName, 100],
      [email, 255],
      [phone, 30],
      [gender, 20],
      [bloodGroup, 5],
      [religion, 50],
      [previousSchool, 200],
      [previousClass, 50],
      [rollNumber, 30],
    ];

    if (lengthChecks.some(([value, max]) => value.length > max)) {
      return Response.json(
        {
          success: false,
          message: "One or more fields exceed the allowed length.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 10. ADMISSION NUMBER VALIDATION
    // -------------------------------------------------

    if (!/^[A-Z0-9/-]+$/.test(admissionNumber)) {
      return Response.json(
        {
          success: false,
          message:
            "Admission number can contain only letters, numbers, hyphens and slashes.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 11. EMAIL VALIDATION
    // -------------------------------------------------

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 12. DATE VALIDATION
    // -------------------------------------------------

    if (dateOfBirth && !isValidDate(dateOfBirth)) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid date of birth.",
        },
        { status: 400 }
      );
    }

    if (!isValidDate(admissionDate)) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid admission date.",
        },
        { status: 400 }
      );
    }

    if (dateOfBirth && dateOfBirth > admissionDate) {
      return Response.json(
        {
          success: false,
          message: "Date of birth cannot be after the admission date.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 13. ACADEMIC YEAR VALIDATION
    // -------------------------------------------------

    if (!/^\d{4}(-\d{4})?$/.test(academicYear)) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid academic year.",
        },
        { status: 400 }
      );
    }

    if (academicYear.includes("-")) {
      const [startYear, endYear] = academicYear
        .split("-")
        .map(Number);

      if (endYear !== startYear + 1) {
        return Response.json(
          {
            success: false,
            message:
              "Academic year range must contain consecutive years.",
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------------------------
    // 14. ROLL NUMBER VALIDATION
    // -------------------------------------------------

    if (rollNumber.length > 30) {
      return Response.json(
        {
          success: false,
          message: "Roll number cannot exceed 30 characters.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 15. GUARDIAN FIELD LENGTH VALIDATION
    // -------------------------------------------------

    const guardianLengthChecks = [
      [guardianData.fatherName, 150],
      [guardianData.fatherPhone, 30],
      [guardianData.fatherOccupation, 100],
      [guardianData.motherName, 150],
      [guardianData.motherPhone, 30],
      [guardianData.motherOccupation, 100],
      [guardianData.guardianName, 150],
      [guardianData.guardianRelationship, 50],
      [guardianData.guardianPhone, 30],
    ];

    if (
      guardianLengthChecks.some(
        ([value, max]) => value && value.length > max
      )
    ) {
      return Response.json(
        {
          success: false,
          message: "One or more guardian fields are too long.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 16. ADDRESS FIELD LENGTH VALIDATION
    // -------------------------------------------------

    const addressLengthChecks = [
      [addressData.village, 150],
      [addressData.postOffice, 150],
      [addressData.postalCode, 20],
      [addressData.unionName, 150],
      [addressData.upazila, 150],
      [addressData.district, 150],
    ];

    if (
      addressLengthChecks.some(
        ([value, max]) => value && value.length > max
      )
    ) {
      return Response.json(
        {
          success: false,
          message: "One or more address fields are too long.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 17. CHECK CLASS AND SECTION
    // -------------------------------------------------

    const [selectedClass] = await db
      .select({
        id: schoolClasses.id,
        name: schoolClasses.name,
        numericOrder: schoolClasses.numericOrder,
        isActive: schoolClasses.isActive,
      })
      .from(schoolClasses)
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(schoolClasses.isActive, true)
        )
      )
      .limit(1);

    if (!selectedClass) {
      return Response.json(
        {
          success: false,
          message: "Selected class does not exist or is inactive.",
        },
        { status: 400 }
      );
    }

    // This school supports Class 6 through Class 10 only.
    if (
      selectedClass.numericOrder < 6 ||
      selectedClass.numericOrder > 10
    ) {
      return Response.json(
        {
          success: false,
          message: "Only Class 6 through Class 10 are supported.",
        },
        { status: 400 }
      );
    }

    const [selectedSection] = await db
      .select({
        id: classSections.id,
        classId: classSections.classId,
        name: classSections.name,
        capacity: classSections.capacity,
        isActive: classSections.isActive,
      })
      .from(classSections)
      .where(
        and(
          eq(classSections.id, classSectionId),
          eq(classSections.classId, classId),
          eq(classSections.isActive, true)
        )
      )
      .limit(1);

    if (!selectedSection) {
      return Response.json(
        {
          success: false,
          message:
            "Selected section does not belong to the selected class or is inactive.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 18. TEACHER ASSIGNMENT VALIDATION
    // -------------------------------------------------

    if (user.role === "teacher") {
      const [assignment] = await db
        .select({
          id: teacherAssignments.id,
        })
        .from(teacherAssignments)
        .where(
          and(
            eq(teacherAssignments.teacherUserId, user.id),
            eq(teacherAssignments.classSectionId, classSectionId),
            eq(teacherAssignments.academicYear, academicYear),
            eq(teacherAssignments.isActive, true)
          )
        )
        .limit(1);

      if (!assignment) {
        return Response.json(
          {
            success: false,
            message:
              "You are not assigned to this class section for the selected academic year.",
          },
          { status: 403 }
        );
      }
    }

    // -------------------------------------------------
    // 19. CHECK DUPLICATE ADMISSION NUMBER
    // -------------------------------------------------

    const [existingStudent] = await db
      .select({
        id: students.id,
      })
      .from(students)
      .where(eq(students.admissionNumber, admissionNumber))
      .limit(1);

    if (existingStudent) {
      return Response.json(
        {
          success: false,
          message: "This admission number is already registered.",
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------
    // 20. CHECK DUPLICATE ROLL NUMBER
    // -------------------------------------------------

    const [existingRoll] = await db
      .select({
        id: studentEnrollments.id,
      })
      .from(studentEnrollments)
      .where(
        and(
          eq(studentEnrollments.classSectionId, classSectionId),
          eq(studentEnrollments.academicYear, academicYear),
          eq(studentEnrollments.rollNumber, rollNumber),
          eq(studentEnrollments.isActive, true)
        )
      )
      .limit(1);

    if (existingRoll) {
      return Response.json(
        {
          success: false,
          message:
            "This roll number is already assigned in the selected section for this academic year.",
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------
    // 21. TRANSACTION: SAVE ALL STUDENT INFORMATION
    // -------------------------------------------------

    const result = await db.transaction(async (tx) => {
      // A. Create student.
      const [newStudent] = await tx
        .insert(students)
        .values({
          admissionNumber,
          firstName,
          lastName: optionalString(lastName),
          email: optionalString(email),
          phone: optionalString(phone),
          dateOfBirth: optionalString(dateOfBirth),

          gender: optionalString(gender),
          bloodGroup: optionalString(bloodGroup),
          religion: optionalString(religion),
          photoUrl: optionalString(photoUrl),

          previousSchool: optionalString(previousSchool),
          previousClass: optionalString(previousClass),

          admissionDate,
          status: "active",
        })
        .returning(studentFields());

      // B. Create guardian information if provided.
      if (hasAnyValue(guardianData)) {
        await tx.insert(studentGuardians).values({
          studentId: newStudent.id,
          ...guardianData,
        });
      }

      // C. Create address information if provided.
      if (hasAnyValue(addressData)) {
        await tx.insert(studentAddresses).values({
          studentId: newStudent.id,
          ...addressData,
        });
      }

      // D. Create academic enrollment.
      const [newEnrollment] = await tx
        .insert(studentEnrollments)
        .values({
          studentId: newStudent.id,
          classSectionId,
          academicYear,
          rollNumber,
          isActive: true,
        })
        .returning({
          id: studentEnrollments.id,
          academicYear: studentEnrollments.academicYear,
          rollNumber: studentEnrollments.rollNumber,
          classSectionId: studentEnrollments.classSectionId,
        });

      // E. Create emergency contacts if provided.
      let savedEmergencyContacts = [];

      if (emergencyContacts.length > 0) {
        savedEmergencyContacts = await tx
          .insert(studentEmergencyContacts)
          .values(
            emergencyContacts.map((contact) => ({
              studentId: newStudent.id,
              ...contact,
            }))
          )
          .returning({
            id: studentEmergencyContacts.id,
            contactName: studentEmergencyContacts.contactName,
            relationship: studentEmergencyContacts.relationship,
            phone: studentEmergencyContacts.phone,
          });
      }

      return {
        student: newStudent,
        enrollment: newEnrollment,
        emergencyContacts: savedEmergencyContacts,
      };
    });

    // -------------------------------------------------
    // 22. SUCCESS RESPONSE
    // -------------------------------------------------

    return Response.json(
      {
        success: true,
        message: "Student registered successfully.",
        data: {
          ...result.student,
          enrollment: result.enrollment,
          className: selectedClass.name,
          sectionName: selectedSection.name,
          emergencyContacts: result.emergencyContacts,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Student registration error:", error);

    // PostgreSQL unique constraint violation.
    if (error.code === "23505") {
      return Response.json(
        {
          success: false,
          message:
            "A student with this admission number or enrollment information already exists.",
        },
        { status: 409 }
      );
    }

    // Foreign key violation.
    if (error.code === "23503") {
      return Response.json(
        {
          success: false,
          message:
            "Some selected student, class or section information is no longer valid. Please refresh and try again.",
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: false,
        message: "Unable to register student. Please try again.",
      },
      { status: 500 }
    );
  }
}
