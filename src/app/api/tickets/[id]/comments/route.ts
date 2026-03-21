import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import {
  canCreateInternalComment,
  getSessionUser,
  ticketCommentInclude,
} from "@/lib/ticket-api";
import { createCommentSchema } from "@/lib/validators/ticket";
import { queueEmail } from "@/lib/email/send";

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view comments",
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

    const comments = await db.ticketComment.findMany({
      where: {
        ticketId: id,
        ...(user.role === "CUSTOMER" ? { isInternal: false } : {}),
      },
      include: ticketCommentInclude,
      orderBy: {
        createdAt: "asc",
      },
    });

    return apiSuccess(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch ticket comments",
    });
  }
}

export async function POST(request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to comment on tickets",
    });
  }

  try {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const validated = createCommentSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    if (validated.data.isInternal && !canCreateInternalComment(user.role)) {
      return apiError("Forbidden", {
        status: 403,
        message: "You are not allowed to create internal comments",
      });
    }

    const ticket = await db.ticket.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        firstResponseAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ticket) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    const isFirstAgentResponse =
      !validated.data.isInternal &&
      user.role !== "CUSTOMER" &&
      ticket.firstResponseAt === null;

    const comment = await db.$transaction(async (tx) => {
      const createdComment = await tx.ticketComment.create({
        data: {
          ticketId: id,
          userId: user.id,
          content: validated.data.content,
          isInternal: validated.data.isInternal ?? false,
        },
        include: ticketCommentInclude,
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: id,
          userId: user.id,
          action: "COMMENTED",
        },
      });

      if (isFirstAgentResponse) {
        await tx.ticket.update({
          where: { id },
          data: {
            firstResponseAt: new Date(),
          },
        });
      }

      return createdComment;
    });

    try {
      const { emitToUser } = await import("@/lib/realtime/socket-server");

      const watchers = await db.ticketWatcher.findMany({
        where: { ticketId: id },
        select: { userId: true },
      });

      const ticketForNotify = await db.ticket.findUnique({
        where: { id },
        select: { assignedToId: true },
      });

      const eventPayload = {
        ticketId: id,
        commentId: comment.id,
        authorId: user.id,
        isInternal: comment.isInternal,
      };

      const notifiedUserIds = new Set<string>();
      for (const w of watchers) {
        if (w.userId !== user.id) {
          notifiedUserIds.add(w.userId);
        }
      }
      if (ticketForNotify?.assignedToId && ticketForNotify.assignedToId !== user.id) {
        notifiedUserIds.add(ticketForNotify.assignedToId);
      }
      for (const uid of notifiedUserIds) {
        emitToUser(uid, "ticket:comment", eventPayload);
      }
    } catch {
      // Socket.io failures must not break API responses
    }

    // Queue email notifications for comment (skip internal comments)
    if (!validated.data.isInternal) {
      const ticketUrl = `${process.env.NEXTAUTH_URL ?? ""}/tickets/${id}`;
      const commenterName = user.name ?? user.email;
      const commentPreview =
        validated.data.content.length > 200
          ? validated.data.content.slice(0, 197) + "..."
          : validated.data.content;

      const recipients = new Set<string>();
      if (ticket.createdBy?.email && ticket.createdBy.id !== user.id) {
        recipients.add(ticket.createdBy.email);
      }
      if (ticket.assignedTo?.email && ticket.assignedTo.id !== user.id) {
        recipients.add(ticket.assignedTo.email);
      }

      for (const email of recipients) {
        await queueEmail({
          type: "ticket_commented",
          to: email,
          data: {
            ticketNumber: id,
            ticketTitle: ticket.title,
            ticketUrl,
            commenterName,
            commentPreview,
          },
        });
      }
    }

    return apiSuccess(comment, {
      status: 201,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Failed to create comment:", error);
    if (error instanceof Error && error.message === 'Invalid JSON in request body') {
      return apiError("Bad request", { status: 400, message: error.message });
    }
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to create comment",
    });
  }
}
