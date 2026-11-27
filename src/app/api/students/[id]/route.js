
import {
  and,
  eq,
  ne,
  isNull,
} from "drizzle-orm";

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

// =====================================================
// HELPERS
// =====================================================

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value) {
  return getString(value) || null;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function hasAnyValue(values) {
  return Object.values(values).some(
    (value) => value !== null && value !== ""
  );
}

// =====================================================
// GET: VIEW STUDENT DETAILS
// =====================================================

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

    if (user.role === "student") {
      return Response.json(
        { success: false, message: "Access denied." },
        { status: 403 }
      );
    }

    // Find the student.
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

    // Enrollment fields.
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

    // Teachers can only view students in their assigned sections.
    if (user.role === "teacher") {
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
          eq(
            schoolClasses.id,
            classSections.classId
          )
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
            eq(
              teacherAssignments.teacherUserId,
              user.id
            ),
            eq(teacherAssignments.isActive, true)
          )
        )
        .where(
          and(
            eq(studentEnrollments.studentId, id),
            eq(studentEnrollments.isActive, true)
          )
        );
    } else {
      // Super Admin, Principal and other permitted roles.
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
          eq(
            schoolClasses.id,
            classSections.classId
          )
        )
        .where(
          eq(studentEnrollments.studentId, id)
        );
    }

    if (
      user.role === "teacher" &&
      enrollments.length === 0
    ) {
      return Response.json(
        {
          success: false,
          message:
            "You are not assigned to any section containing this student.",
        },
        { status: 403 }
      );
    }

    // Guardian information.
    const [guardian] = await db
      .select()
      .from(studentGuardians)
      .where(
        eq(studentGuardians.studentId, id)
      )
      .limit(1);

    // Address information.
    const [address] = await db
      .select()
      .from(studentAddresses)
      .where(
        eq(studentAddresses.studentId, id)
      )
      .limit(1);

    // Emergency contacts.
    const emergencyContacts = await db
      .select()
      .from(studentEmergencyContacts)
      .where(
        eq(studentEmergencyContacts.studentId, id)
      );

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

// =====================================================
// PUT: UPDATE COMPLETE STUDENT INFORMATION
// =====================================================

export async function PUT(request, { params }) {
  try {
    // 1. PERMISSION CHECK

    const permission = await requirePermission(
      request,
      "students",
      "update"
    );

    if (!permission.authorized) {
      return permission.response;
    }

    const user = permission.user;
    const { id } = await params;

    // Only Super Admin and Principal can edit records.
    if (!["superAdmin", "principal"].includes(user.role)) {
      return Response.json(
        {
          success: false,
          message: "You are not allowed to edit student records.",
        },
        { status: 403 }
      );
    }

    if (!id) {
      return Response.json(
        { success: false, message: "Student ID is required." },
        { status: 400 }
      );
    }

    // 2. READ REQUEST BODY

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, message: "Invalid JSON request." },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return Response.json(
        { success: false, message: "Invalid request data." },
        { status: 400 }
      );
    }

    // 3. STUDENT INFORMATION

    const admissionNumber = getString(
      body.admissionNumber
    ).toUpperCase();

    const firstName = getString(body.firstName);
    const lastName = getString(body.lastName);
    const email = getString(body.email).toLowerCase();
    const phone = getString(body.phone);
    const dateOfBirth = getString(body.dateOfBirth);

    const gender = optionalString(body.gender);
    const bloodGroup = optionalString(body.bloodGroup);
    const religion = optionalString(body.religion);
    const photoUrl = optionalString(body.photoUrl);

    const previousSchool = optionalString(
      body.previousSchool
    );

    const previousClass = optionalString(
      body.previousClass
    );

    const admissionDate = getString(body.admissionDate);

    const status =
      body.status === undefined
        ? null
        : getString(body.status);

    // 4. ACADEMIC INFORMATION

    const classId = getString(body.classId);
    const classSectionId = getString(
      body.classSectionId
    );

    const academicYear = getString(body.academicYear);
    const rollNumber = getString(body.rollNumber);

    // 5. GUARDIAN INFORMATION

    const guardianData = {
      fatherName: optionalString(body.fatherName),
      fatherPhone: optionalString(body.fatherPhone),
      fatherOccupation: optionalString(
        body.fatherOccupation
      ),

      motherName: optionalString(body.motherName),
      motherPhone: optionalString(body.motherPhone),
      motherOccupation: optionalString(
        body.motherOccupation
      ),

      guardianName: optionalString(body.guardianName),
      guardianRelationship: optionalString(
        body.guardianRelationship
      ),
      guardianPhone: optionalString(body.guardianPhone),
    };

    // 6. ADDRESS INFORMATION

    const addressData = {
      village: optionalString(body.village),
      postOffice: optionalString(body.postOffice),
      postalCode: optionalString(body.postalCode),
      unionName: optionalString(body.unionName),
      upazila: optionalString(body.upazila),
      district: optionalString(body.district),
      presentAddress: optionalString(
        body.presentAddress
      ),
      permanentAddress: optionalString(
        body.permanentAddress
      ),
    };

    // 7. EMERGENCY CONTACTS

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

    const emergencyContacts = [];

    for (const contact of body.emergencyContacts || []) {
      if (
        !contact ||
        typeof contact !== "object" ||
        Array.isArray(contact)
      ) {
        return Response.json(
          {
            success: false,
            message: "Invalid emergency contact information.",
          },
          { status: 400 }
        );
      }

      const contactName = getString(
        contact.contactName
      );

      const relationship = getString(
        contact.relationship
      );

      const contactPhone = getString(contact.phone);

      if (
        !contactName &&
        !relationship &&
        !contactPhone
      ) {
        continue;
      }

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
            message:
              "An emergency contact field is too long.",
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

    if (emergencyContacts.length > 10) {
      return Response.json(
        {
          success: false,
          message:
            "You can add a maximum of 10 emergency contacts.",
        },
        { status: 400 }
      );
    }

    // 8. REQUIRED FIELD VALIDATION

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

    if (
      !isValidDate(admissionDate) ||
      (dateOfBirth && !isValidDate(dateOfBirth))
    ) {
      return Response.json(
        {
          success: false,
          message: "Please provide valid student dates.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{4}(-\d{4})?$/.test(academicYear)) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid academic year.",
        },
        { status: 400 }
      );
    }

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

    // 9. FIELD LENGTH VALIDATION

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
      [academicYear, 20],
    ];

    if (
      lengthChecks.some(
        ([value, max]) => value.length > max
      )
    ) {
      return Response.json(
        {
          success: false,
          message:
            "One or more fields exceed the allowed length.",
        },
        { status: 400 }
      );
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return Response.json(
        { success: false, message: "Invalid email address." },
        { status: 400 }
      );
    }

    // 10. CHECK EXISTING STUDENT

    const [existingStudent] = await db
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.id, id),
          isNull(students.deletedAt)
        )
      )
      .limit(1);

    if (!existingStudent) {
      return Response.json(
        { success: false, message: "Student not found." },
        { status: 404 }
      );
    }

    // 11. CHECK DUPLICATE ADMISSION NUMBER

    const [duplicateAdmission] = await db
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.admissionNumber, admissionNumber),
          ne(students.id, id)
        )
      )
      .limit(1);

    if (duplicateAdmission) {
      return Response.json(
        {
          success: false,
          message:
            "This admission number is already in use.",
        },
        { status: 409 }
      );
    }

    // 12. VALIDATE CLASS AND SECTION

    const [selectedSection] = await db
      .select({
        sectionId: classSections.id,
        sectionName: classSections.name,
        classId: schoolClasses.id,
        className: schoolClasses.name,
      })
      .from(classSections)
      .innerJoin(
        schoolClasses,
        eq(
          schoolClasses.id,
          classSections.classId
        )
      )
      .where(
        and(
          eq(classSections.id, classSectionId),
          eq(classSections.classId, classId),
          eq(classSections.isActive, true),
          eq(schoolClasses.isActive, true)
        )
      )
      .limit(1);

    if (
      !selectedSection ||
      !/^Class (6|7|8|9|10)$/.test(
        selectedSection.className
      )
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Please select a valid active class and section.",
        },
        { status: 400 }
      );
    }

    // 13. CHECK DUPLICATE ROLL NUMBER

    const [duplicateRoll] = await db
      .select({ id: studentEnrollments.id })
      .from(studentEnrollments)
      .where(
        and(
          eq(
            studentEnrollments.classSectionId,
            classSectionId
          ),
          eq(
            studentEnrollments.academicYear,
            academicYear
          ),
          eq(
            studentEnrollments.rollNumber,
            rollNumber
          ),
          ne(studentEnrollments.studentId, id),
          eq(studentEnrollments.isActive, true)
        )
      )
      .limit(1);

    if (duplicateRoll) {
      return Response.json(
        {
          success: false,
          message:
            "This roll number is already assigned in the selected section and academic year.",
        },
        { status: 409 }
      );
    }

    // 14. UPDATE EVERYTHING IN ONE TRANSACTION

    await db.transaction(async (tx) => {
      const studentUpdate = {
        admissionNumber,
        firstName,
        lastName: optionalString(lastName),
        email: optionalString(email),
        phone: optionalString(phone),
        dateOfBirth: dateOfBirth || null,
        gender,
        bloodGroup,
        religion,
        photoUrl,
        previousSchool,
        previousClass,
        admissionDate,
        updatedAt: new Date(),
      };

      if (status) {
        studentUpdate.status = status;
      }

      await tx
        .update(students)
        .set(studentUpdate)
        .where(eq(students.id, id));

      // Guardian information.

      const [existingGuardian] = await tx
        .select({ id: studentGuardians.id })
        .from(studentGuardians)
        .where(
          eq(studentGuardians.studentId, id)
        )
        .limit(1);

      if (hasAnyValue(guardianData)) {
        if (existingGuardian) {
          await tx
            .update(studentGuardians)
            .set({
              ...guardianData,
              updatedAt: new Date(),
            })
            .where(
              eq(studentGuardians.studentId, id)
            );
        } else {
          await tx.insert(studentGuardians).values({
            studentId: id,
            ...guardianData,
          });
        }
      } else if (existingGuardian) {
        await tx
          .delete(studentGuardians)
          .where(
            eq(studentGuardians.studentId, id)
          );
      }

      // Address information.

      const [existingAddress] = await tx
        .select({ id: studentAddresses.id })
        .from(studentAddresses)
        .where(
          eq(studentAddresses.studentId, id)
        )
        .limit(1);

      if (hasAnyValue(addressData)) {
        if (existingAddress) {
          await tx
            .update(studentAddresses)
            .set({
              ...addressData,
              updatedAt: new Date(),
            })
            .where(
              eq(studentAddresses.studentId, id)
            );
        } else {
          await tx.insert(studentAddresses).values({
            studentId: id,
            ...addressData,
          });
        }
      } else if (existingAddress) {
        await tx
          .delete(studentAddresses)
          .where(
            eq(studentAddresses.studentId, id)
          );
      }

      // Academic enrollment.
      // Preserve enrollments from other academic years.

      const [existingEnrollment] = await tx
        .select({ id: studentEnrollments.id })
        .from(studentEnrollments)
        .where(
          and(
            eq(studentEnrollments.studentId, id),
            eq(
              studentEnrollments.academicYear,
              academicYear
            )
          )
        )
        .limit(1);

      // Deactivate only this student's enrollment
      // for the selected academic year.
      await tx
        .update(studentEnrollments)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(studentEnrollments.studentId, id),
            eq(
              studentEnrollments.academicYear,
              academicYear
            )
          )
        );

      if (existingEnrollment) {
        await tx
          .update(studentEnrollments)
          .set({
            classSectionId,
            rollNumber,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(
            eq(
              studentEnrollments.id,
              existingEnrollment.id
            )
          );
      } else {
        await tx.insert(studentEnrollments).values({
          studentId: id,
          classSectionId,
          academicYear,
          rollNumber,
          isActive: true,
        });
      }

      // Replace emergency contacts when supplied.

      if (body.emergencyContacts !== undefined) {
        await tx
          .delete(studentEmergencyContacts)
          .where(
            eq(studentEmergencyContacts.studentId, id)
          );

        if (emergencyContacts.length > 0) {
          await tx
            .insert(studentEmergencyContacts)
            .values(
              emergencyContacts.map((contact) => ({
                studentId: id,
                ...contact,
              }))
            );
        }
      }
    });

    return Response.json({
      success: true,
      message: "Student information updated successfully.",
    });
  } catch (error) {
    console.error("Student update error:", error);

    if (error.code === "23505") {
      return Response.json(
        {
          success: false,
          message:
            "A duplicate admission number, academic enrollment or roll number already exists.",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        message: "Unable to update student information.",
      },
      { status: 500 }
    );
  }
}
