
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const allowedRoles = [
    "superAdmin",
    "schoolAdmin",
    "principal",
    "accountant",
    "receptionist",
    "teacher",
    "librarian",
    "hrManager",
    "websiteEditor",
  ];

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/login");
  }

  return children;
}
