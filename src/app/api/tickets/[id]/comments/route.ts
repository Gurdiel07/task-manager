import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import {
  canCreateInternalComment,
  getSessionUser,
  ticketCommentInclude,
} from "@/lib/ticket-api";
import { createCommentSchema } from "@/lib/validators/ticket";

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
        firstResponseAt: true,
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
