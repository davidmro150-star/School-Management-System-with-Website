
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,

  dashboard: ["read"],

  // User account management: Super Admin only.
  userManagement: [
    "create",
    "read",
    "update",
    "delete",
    "assignRole",
    "resetPassword",
    "activate",
    "deactivate",
  ],

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

export const rolePermissionMap = {
  // 1. Super Admin: Full system access.
  superAdmin: Object.fromEntries(
    Object.entries(statement).map(([resource, actions]) => [
      resource,
      [...actions],
    ])
  ),

  // 2. Principal: Full teacher/staff management.
  principal: {
    dashboard: ["read"],
    students: ["create", "read", "update", "export"],
    guardians: ["read"],
    admissions: ["read", "approve", "reject"],
    staff: ["create", "read", "update", "delete"],
    academics: ["create", "read", "update", "assign"],
    attendance: ["mark", "read", "correct", "export"],
    fees: ["read"],
    examinations: ["create", "read", "update", "publish"],
    results: ["create", "read", "update", "publish", "export"],
    website: ["create", "read", "update", "publish"],
    media: ["upload", "read"],
    reports: ["read", "export"],
  },

  // 3. Teacher: Assigned student and academic access.
  teacher: {
    dashboard: ["read"],
    students: ["create", "read"],
    academics: ["read"],
    attendance: ["mark", "read"],
    examinations: ["read"],
    results: ["create", "read", "update"],
    website: ["read"],
    library: ["read"],
  },

  // 4. Student: Own academic information only.
  student: {
    dashboard: ["read"],
    academics: ["read"],
    attendance: ["read"],
    examinations: ["read"],
    results: ["read"],
    website: ["read"],
    library: ["read"],
  },

  // 5. Accountant: Student records and financial management.
  accountant: {
    dashboard: ["read"],
    students: ["create", "read"],
    academics: ["read"],
    fees: [...statement.fees],
    reports: ["read", "export"],
  },
};

// Convert permission definitions into Better Auth roles.
function createRole(grants = {}) {
  const permissions = Object.fromEntries(
    Object.keys(statement).map((resource) => [
      resource,
      grants[resource] || [],
    ])
  );

  return ac.newRole(permissions);
}

export const roleDefinitions = Object.fromEntries(
  Object.entries(rolePermissionMap).map(([role, permissions]) => [
    role,
    createRole(permissions),
  ])
);

// Server-side permission checker.
export function hasRolePermission(role, resource, action) {
  if (!role || !resource || !action) {
    return false;
  }

  return (
    rolePermissionMap[role]?.[resource]?.includes(action) ?? false
  );
}
