import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  getSessionUser,
  isManagerRole,
  ticketWatcherInclude,
} from "@/lib/ticket-api";
import { ticketWatcherSchema } from "@/lib/validators/ticket";

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view ticket watchers",
    });
  }

  try {
    const { id } = await context.params;

    const ticket = await db.ticket.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!ticket) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    const watchers = await db.ticketWatcher.findMany({
      where: {
        ticketId: id,
      },
      include: ticketWatcherInclude,
      orderBy: {
        addedAt: "asc",
      },
    });

    return apiSuccess(watchers);
  } catch (error) {
    console.error("Failed to fetch ticket watchers:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch ticket watchers",
    });
  }
}

export async function POST(request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to watch tickets",
    });
  }

  try {
    const { id } = await context.params;
    const rawBody = await request.text();
    const body = rawBody ? (JSON.parse(rawBody) as unknown) : {};
    const validated = ticketWatcherSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    if (validated.data.userId && !isManagerRole(user.role)) {
      return apiError("Forbidden", {
        status: 403,
        message: "Only managers and admins can add other watchers",
      });
    }

    const targetUserId = validated.data.userId ?? user.id;

    const ticket = await db.ticket.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!ticket) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    const watcher = await db.ticketWatcher.upsert({
      where: {
        ticketId_userId: {
          ticketId: id,
          userId: targetUserId,
        },
      },
      update: {},
      create: {
        ticketId: id,
        userId: targetUserId,
      },
      include: ticketWatcherInclude,
    });

    return apiSuccess(watcher, {
      status: 201,
      message: "Watcher added successfully",
    });
  } catch (error) {
    console.error("Failed to add watcher:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to add watcher",
    });
  }
}

export async function DELETE(request: NextRequest, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to unwatch tickets",
    });
  }

  try {
    const { id } = await context.params;
    const requestedUserId = request.nextUrl.searchParams.get("userId");

    if (requestedUserId && requestedUserId !== user.id && !isManagerRole(user.role)) {
      return apiError("Forbidden", {
        status: 403,
        message: "Only managers and admins can remove other watchers",
      });
    }

    const targetUserId = requestedUserId ?? user.id;

    const removedWatcher = await db.ticketWatcher.deleteMany({
      where: {
        ticketId: id,
        userId: targetUserId,
      },
    });

    if (removedWatcher.count === 0) {
      return apiError("Not found", {
        status: 404,
        message: "Watcher not found",
      });
    }

    return apiSuccess(null, {
      message: "Watcher removed successfully",
    });
  } catch (error) {
    console.error("Failed to remove watcher:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to remove watcher",
    });
  }
}
