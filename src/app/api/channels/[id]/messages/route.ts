import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { Prisma } from "@/generated/prisma/client";

const messagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

const createMessageSchema = z.object({
  senderIdentifier: z.string().min(1, "Sender identifier is required"),
  content: z.string().min(1, "Content is required"),
  ticketId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  const { id } = await params;

  try {
    const channel = await db.channel.findUnique({ where: { id } });
    if (!channel) {
      return apiError("Not found", { status: 404, message: "Channel not found" });
    }

    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = messagesQuerySchema.safeParse(query);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { page, limit } = validated.data;
    const skip = (page - 1) * limit;

    const [messages, total] = await db.$transaction([
      db.channelMessage.findMany({
        where: { channelId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.channelMessage.count({ where: { channelId: id } }),
    ]);

    return apiSuccess({
      messages,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Failed to fetch channel messages:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch messages" });
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

  const { id } = await params;

  try {
    const channel = await db.channel.findUnique({ where: { id } });
    if (!channel) {
      return apiError("Not found", { status: 404, message: "Channel not found" });
    }

    const body = await request.json();
    const validated = createMessageSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { metadata, ticketId, ...rest } = validated.data;

    const message = await db.channelMessage.create({
      data: {
        ...rest,
        channelId: id,
        direction: "INBOUND",
        ticketId: ticketId ?? null,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        processedAt: new Date(),
      },
    });

    return apiSuccess(message, { status: 201, message: "Message created successfully" });
  } catch (error) {
    console.error("Failed to create channel message:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to create message" });
  }
}
