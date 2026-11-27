
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

const allowedRoles = [
  "superAdmin",
  "principal",
  "teacher",
  "student",
  "accountant",
];

export default async function AdminLayout({ children }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
