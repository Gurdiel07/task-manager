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
import { automationQueue } from "@/lib/queue/queues";
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

    if (!ticket || (user.role === "CUSTOMER" && ticket.createdById !== user.id)) {
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
        createdById: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!existingTicket || (user.role === "CUSTOMER" && existingTicket.createdById !== user.id)) {
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

    try {
      const { emitToUser, emitToTeam } = await import("@/lib/realtime/socket-server");
      const eventPayload = {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        changes: changes.map((c) => c.field),
      };
      if (ticket.assignedToId) {
        emitToUser(ticket.assignedToId, "ticket:updated", eventPayload);
      }
      if (ticket.teamId) {
        emitToTeam(ticket.teamId, "ticket:updated", eventPayload);
      }
      const watchers = await db.ticketWatcher.findMany({
        where: { ticketId: id },
        select: { userId: true },
      });
      for (const w of watchers) {
        emitToUser(w.userId, "ticket:updated", eventPayload);
      }
    } catch {
      // Socket.io failures must not break API responses
    }

    try {
      const statusChanged =
        validated.data.status !== undefined &&
        validated.data.status !== existingTicket.status;

      await automationQueue.add("automation", {
        ticketId: id,
        trigger: "TICKET_UPDATED",
      });

      if (statusChanged) {
        await automationQueue.add("automation", {
          ticketId: id,
          trigger: "STATUS_CHANGED",
        });
      }
    } catch {
      // Queue failures must not break API responses
    }

    // Email notifications for assignment/status changes
    const ticketUrl = `${process.env.NEXTAUTH_URL ?? ""}/tickets/${id}`;
    const assigneeChanged =
      validated.data.assignedToId !== undefined &&
      validated.data.assignedToId !== existingTicket.assignedToId;
    const statusChanged =
      validated.data.status !== undefined &&
      validated.data.status !== existingTicket.status;

    if (assigneeChanged && ticket.assignedTo?.email) {
      await queueEmail({
        type: "ticket_assigned",
        to: ticket.assignedTo.email,
        data: {
          ticketNumber: id,
          ticketTitle: ticket.title,
          ticketUrl,
          assigneeName: ticket.assignedTo.name ?? ticket.assignedTo.email,
        },
      });
    }

    if (statusChanged) {
      const recipients = new Set<string>();
      if (ticket.createdBy?.email) recipients.add(ticket.createdBy.email);
      if (ticket.assignedTo?.email) recipients.add(ticket.assignedTo.email);
      for (const email of recipients) {
        await queueEmail({
          type: "ticket_status_changed",
          to: email,
          data: {
            ticketNumber: id,
            ticketTitle: ticket.title,
            ticketUrl,
            oldStatus: existingTicket.status,
            newStatus: validated.data.status!,
          },
        });
      }
    }

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

    const ticketToDelete = await db.ticket.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, createdById: true },
    });

    if (!ticketToDelete || (user.role === "CUSTOMER" && ticketToDelete.createdById !== user.id)) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    await db.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

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
