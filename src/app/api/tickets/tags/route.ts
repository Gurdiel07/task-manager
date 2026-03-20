import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";

export async function GET() {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view ticket tags",
    });
  }

  try {
    const tags = await db.ticketTag.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return apiSuccess(tags);
  } catch (error) {
    console.error("Failed to fetch ticket tags:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch ticket tags",
    });
  }
}
