import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { updateTeamSchema } from "@/lib/validators/team";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  const { id } = await params;

  try {
    const team = await db.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { members: true, tickets: true } },
      },
    });

    if (!team) {
      return apiError("Not found", { status: 404, message: "Team not found" });
    }

    return apiSuccess(team);
  } catch (error) {
    console.error("Failed to fetch team:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch team" });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    return apiError("Forbidden", { status: 403, message: "Only admins and managers can update teams" });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = updateTeamSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const existing = await db.team.findUnique({ where: { id } });
    if (!existing) {
      return apiError("Not found", { status: 404, message: "Team not found" });
    }

    const team = await db.team.update({
      where: { id },
      data: validated.data,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        _count: { select: { members: true, tickets: true } },
      },
    });

    return apiSuccess(team);
  } catch (error) {
    console.error("Failed to update team:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to update team" });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN") {
    return apiError("Forbidden", { status: 403, message: "Only admins can delete teams" });
  }

  const { id } = await params;

  try {
    const team = await db.team.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });

    if (!team) {
      return apiError("Not found", { status: 404, message: "Team not found" });
    }

    if (team._count.tickets > 0) {
      return apiError("Conflict", {
        status: 409,
        message: "Cannot delete team with assigned tickets",
      });
    }

    await db.team.delete({ where: { id } });

    return apiSuccess(null, { message: "Team deleted successfully" });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to delete team" });
  }
}
