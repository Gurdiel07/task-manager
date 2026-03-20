import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { updateChannelSchema } from "@/lib/validators/channel";
import { Prisma } from "@/generated/prisma/client";

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
    const channel = await db.channel.findUnique({
      where: { id },
      include: { _count: { select: { messages: true } } },
    });

    if (!channel) {
      return apiError("Not found", { status: 404, message: "Channel not found" });
    }

    return apiSuccess(channel);
  } catch (error) {
    console.error("Failed to fetch channel:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch channel" });
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

  if (user.role !== "ADMIN") {
    return apiError("Forbidden", { status: 403, message: "Only admins can update channels" });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = updateChannelSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const existing = await db.channel.findUnique({ where: { id } });
    if (!existing) {
      return apiError("Not found", { status: 404, message: "Channel not found" });
    }

    const { config, ...rest } = validated.data;
    const updateData: Prisma.ChannelUpdateInput = { ...rest };
    if (config !== undefined) {
      updateData.config = config as Prisma.InputJsonValue;
    }

    const channel = await db.channel.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { messages: true } } },
    });

    return apiSuccess(channel);
  } catch (error) {
    console.error("Failed to update channel:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to update channel" });
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
    return apiError("Forbidden", { status: 403, message: "Only admins can delete channels" });
  }

  const { id } = await params;

  try {
    const channel = await db.channel.findUnique({
      where: { id },
      include: { _count: { select: { messages: true } } },
    });

    if (!channel) {
      return apiError("Not found", { status: 404, message: "Channel not found" });
    }

    if (channel._count.messages > 0) {
      return apiError("Conflict", {
        status: 409,
        message: "Cannot delete channel with existing messages",
      });
    }

    await db.channel.delete({ where: { id } });

    return apiSuccess(null, { message: "Channel deleted successfully" });
  } catch (error) {
    console.error("Failed to delete channel:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to delete channel" });
  }
}
