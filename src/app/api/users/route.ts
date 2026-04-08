import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser, userListSelect } from "@/lib/ticket-api";

const usersQuerySchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "AGENT", "CUSTOMER"]).optional(),
  search: z.string().trim().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view users",
    });
  }

  if (user.role === "CUSTOMER") {
    return apiError("Forbidden", {
      status: 403,
      message: "Insufficient permissions",
    });
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = usersQuerySchema.safeParse(query);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const users = await db.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(validated.data.role ? { role: validated.data.role } : {}),
        ...(validated.data.search
          ? {
              OR: [
                { name: { contains: validated.data.search } },
                { email: { contains: validated.data.search } },
              ],
            }
          : {}),
      },
      select: userListSelect,
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });

    return apiSuccess(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch users",
    });
  }
}
