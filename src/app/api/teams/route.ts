import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { createTeamSchema } from "@/lib/validators/team";

export async function GET() {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view teams",
    });
  }

  try {
    const teams = await db.team.findMany({
      include: {
        _count: {
          select: {
            members: true,
            tickets: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess(teams);
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch teams",
    });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    return apiError("Forbidden", { status: 403, message: "Only admins and managers can create teams" });
  }

  try {
    const body = await request.json();
    const validated = createTeamSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const team = await db.team.create({
      data: validated.data,
      include: {
        _count: { select: { members: true, tickets: true } },
      },
    });

    return apiSuccess(team, { status: 201, message: "Team created successfully" });
  } catch (error) {
    console.error("Failed to create team:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to create team" });
  }
}
