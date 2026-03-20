import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  buildTicketUpdateData,
  getChangedTicketFields,
  getSessionUser,
  ticketDetailInclude,
} from "@/lib/ticket-api";
import { updateTicketSchema } from "@/lib/validators/ticket";

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view ticket details",
    });
  }

  try {
    const { id } = await context.params;

    const ticket = await db.ticket.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: ticketDetailInclude,
    });

    if (!ticket) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    return apiSuccess(ticket);
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch ticket details",
    });
  }
}

export async function PUT(request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to update tickets",
    });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateTicketSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const existingTicket = await db.ticket.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        category: true,
        subcategory: true,
        channel: true,
        assignedToId: true,
        teamId: true,
        dueDate: true,
      },
    });

    if (!existingTicket) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    const changes = getChangedTicketFields(existingTicket, validated.data);

    const ticket = await db.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: buildTicketUpdateData(validated.data),
        include: ticketDetailInclude,
      });

      if (changes.length > 0) {
        await tx.ticketHistory.createMany({
          data: changes.map((change) => ({
            ticketId: id,
            userId: user.id,
            action: "UPDATED",
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
          })),
        });
      }

      return updatedTicket;
    });

    return apiSuccess(ticket, {
      message:
        changes.length > 0
          ? "Ticket updated successfully"
          : "No ticket fields changed",
    });
  } catch (error) {
    console.error("Failed to update ticket:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to update ticket",
    });
  }
}

export async function DELETE(_request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to delete tickets",
    });
  }

  try {
    const { id } = await context.params;

    const deletedTicket = await db.ticket.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (deletedTicket.count === 0) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    return apiSuccess(null, {
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete ticket:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to delete ticket",
    });
  }
}
