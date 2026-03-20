import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { addTeamMemberSchema } from "@/lib/validators/team";

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
    const team = await db.team.findUnique({ where: { id } });
    if (!team) {
      return apiError("Not found", { status: 404, message: "Team not found" });
    }

    const members = await db.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return apiSuccess(members);
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch team members" });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    return apiError("Forbidden", { status: 403, message: "Only admins and managers can add team members" });
  }

  const { id } = await params;

  try {
    const team = await db.team.findUnique({ where: { id } });
    if (!team) {
      return apiError("Not found", { status: 404, message: "Team not found" });
    }

    const body = await request.json();
    const validated = addTeamMemberSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { userId, role } = validated.data;

    const userExists = await db.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return apiError("Not found", { status: 404, message: "User not found" });
    }

    const existing = await db.teamMember.findUnique({
      where: { userId_teamId: { teamId: id, userId } },
    });

    if (existing) {
      return apiError("Conflict", { status: 409, message: "User is already a member of this team" });
    }

    const member = await db.teamMember.create({
      data: { teamId: id, userId, role: role ?? undefined },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return apiSuccess(member, { status: 201, message: "Member added successfully" });
  } catch (error) {
    console.error("Failed to add team member:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to add team member" });
  }
}

const removeQuerySchema = z.object({
  userId: z.string().min(1, "userId is required"),
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    return apiError("Forbidden", { status: 403, message: "Only admins and managers can remove team members" });
  }

  const { id } = await params;

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = removeQuerySchema.safeParse(query);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { userId } = validated.data;

    const member = await db.teamMember.findUnique({
      where: { userId_teamId: { teamId: id, userId } },
    });

    if (!member) {
      return apiError("Not found", { status: 404, message: "Member not found in this team" });
    }

    await db.teamMember.delete({
      where: { userId_teamId: { teamId: id, userId } },
    });

    return apiSuccess(null, { message: "Member removed successfully" });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to remove team member" });
  }
}
