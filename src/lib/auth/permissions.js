
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

// EduManage permission definitions.
const statement = {
  ...defaultStatements,

  dashboard: ["read"],

  students: ["create", "read", "update", "delete", "export", "promote"],
  guardians: ["create", "read", "update", "delete"],
  admissions: ["create", "read", "update", "approve", "reject"],
  staff: ["create", "read", "update", "delete"],
  academics: ["create", "read", "update", "delete", "assign"],
  attendance: ["mark", "read", "update", "correct", "export"],
  fees: ["create", "read", "update", "refund", "waive", "export"],
  examinations: ["create", "read", "update", "delete", "publish"],
  results: ["create", "read", "update", "publish", "export"],
  website: ["create", "read", "update", "delete", "publish"],
  media: ["upload", "read", "delete"],
  library: ["create", "read", "update", "delete", "issue", "return"],
  transport: ["create", "read", "update", "delete"],
  reports: ["read", "export"],
  settings: ["read", "update"],
  auditLogs: ["read"],
};

export const ac = createAccessControl(statement);

function createRole(grants = {}) {
  const permissions = Object.fromEntries(
    Object.keys(statement).map((resource) => [
      resource,
      grants[resource] || [],
    ])
  );

  return ac.newRole(permissions);
}

// Super Admin: complete system access.
const superAdmin = createRole(
  Object.fromEntries(
    Object.entries(statement).map(([resource, actions]) => [
      resource,
      [...actions],
    ])
  )
);

// School Administrator.
const schoolAdmin = createRole({
  dashboard: ["read"],
  students: statement.students,
  guardians: statement.guardians,
  admissions: statement.admissions,
  staff: statement.staff,
  academics: statement.academics,
  attendance: statement.attendance,
  fees: statement.fees,
  examinations: statement.examinations,
  results: statement.results,
  website: statement.website,
  media: statement.media,
  library: statement.library,
  transport: statement.transport,
  reports: statement.reports,
  settings: statement.settings,
  auditLogs: ["read"],
});

// Principal.
const principal = createRole({
  dashboard: ["read"],
  students: ["read"],
  guardians: ["read"],
  staff: ["read"],
  academics: ["read", "update", "assign"],
  attendance: ["read", "export"],
  examinations: ["create", "read", "update", "publish"],
  results: statement.results,
  website: ["create", "read", "update", "publish"],
  reports: statement.reports,
});

// Teacher.
const teacher = createRole({
  dashboard: ["read"],
  students: ["read"],
  academics: ["read"],
  attendance: ["mark", "read"],
  examinations: ["read"],
  results: ["create", "read", "update"],
  website: ["read"],
  library: ["read"],
});

// Accountant.
const accountant = createRole({
  dashboard: ["read"],
  students: ["read"],
  fees: statement.fees,
  reports: statement.reports,
});

// Receptionist.
const receptionist = createRole({
  dashboard: ["read"],
  students: ["create", "read", "update"],
  guardians: ["create", "read", "update"],
  admissions: statement.admissions,
  fees: ["create", "read"],
});

// Librarian.
const librarian = createRole({
  dashboard: ["read"],
  students: ["read"],
  library: statement.library,
  reports: ["read"],
});

// Student.
const student = createRole({
  dashboard: ["read"],
  academics: ["read"],
  attendance: ["read"],
  examinations: ["read"],
  results: ["read"],
  website: ["read"],
  library: ["read"],
});

// Parent.
const parent = createRole({
  dashboard: ["read"],
  students: ["read"],
  attendance: ["read"],
  fees: ["read"],
  results: ["read"],
  website: ["read"],
});

export const roleDefinitions = {
  superAdmin,
  schoolAdmin,
  principal,
  teacher,
  accountant,
  receptionist,
  librarian,
  student,
  parent,
};
