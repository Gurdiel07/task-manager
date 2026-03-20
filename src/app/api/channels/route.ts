import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { createChannelSchema } from "@/lib/validators/channel";
import { Prisma } from "@/generated/prisma/client";

export async function GET() {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  try {
    const channels = await db.channel.findMany({
      include: { _count: { select: { messages: true } } },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(channels);
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch channels" });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN") {
    return apiError("Forbidden", { status: 403, message: "Only admins can create channels" });
  }

  try {
    const body = await request.json();
    const validated = createChannelSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { config, isActive, ...rest } = validated.data;
    const channel = await db.channel.create({
      data: {
        ...rest,
        isActive: isActive ?? true,
        config: (config ?? {}) as Prisma.InputJsonValue,
      },
      include: { _count: { select: { messages: true } } },
    });

    return apiSuccess(channel, { status: 201, message: "Channel created successfully" });
  } catch (error) {
    console.error("Failed to create channel:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to create channel" });
  }
}
