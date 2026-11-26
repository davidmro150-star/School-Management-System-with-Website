
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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

  // Require login.
  if (!session) {
    redirect("/login");
  }

  // Only allow the five configured roles.
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/login");
  }

  return children;
}
