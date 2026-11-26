
import { auth } from "@/lib/auth";
import { hasRolePermission } from "@/lib/auth/permissions";

export async function requirePermission(request, resource, action) {
  // Get the authenticated user's session.
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Reject unauthenticated requests.
  if (!session?.user) {
    return {
      authorized: false,
      response: Response.json(
        {
          success: false,
          message: "Authentication required. Please log in.",
        },
        { status: 401 }
      ),
    };
  }

  // Get the user's current role.
  const role = session.user.role;

  // Check the requested permission.
  if (!hasRolePermission(role, resource, action)) {
    return {
      authorized: false,
      response: Response.json(
        {
          success: false,
          message: "You do not have permission to perform this action.",
        },
        { status: 403 }
      ),
    };
  }

  // Permission granted.
  return {
    authorized: true,
    session,
    user: session.user,
  };
}
