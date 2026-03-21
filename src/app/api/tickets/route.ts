import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import {
  getSessionUser,
  getTicketOrderBy,
  getTicketWhere,
  ticketListInclude,
} from "@/lib/ticket-api";
import {
  createTicketSchema,
  ticketListQuerySchema,
} from "@/lib/validators/ticket";
import { automationQueue } from "@/lib/queue/queues";
import { queueEmail } from "@/lib/email/send";

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view tickets",
    });
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = ticketListQuerySchema.safeParse(query);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const filters = validated.data;
    const where = getTicketWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    if (user.role === "CUSTOMER") {
      (where as Record<string, unknown>).createdById = user.id;
    }

    const [tickets, total] = await db.$transaction([
      db.ticket.findMany({
        where,
        include: ticketListInclude,
        orderBy: getTicketOrderBy(filters.sort, filters.order),
        skip,
        take: filters.limit,
      }),
      db.ticket.count({ where }),
    ]);

    return apiSuccess({
      tickets,
      total,
      page: filters.page,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    });
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch tickets",
    });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to create tickets",
    });
  }

  try {
    const body = await parseJsonBody(request);
    const validated = createTicketSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const payload = validated.data;

    const ticket = await db.$transaction(async (tx) => {
      const createdTicket = await tx.ticket.create({
        data: {
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          category: payload.category || undefined,
          subcategory: payload.subcategory || undefined,
          channel: payload.channel,
          dueDate: payload.dueDate,
          createdById: user.id,
          assignedToId: payload.assignedToId || undefined,
          teamId: payload.teamId || undefined,
        },
        include: {
          ...ticketListInclude,
          createdBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: createdTicket.id,
          userId: user.id,
          action: "CREATED",
        },
      });

      return createdTicket;
    });

    try {
      const { emitToUser, emitToTeam } = await import("@/lib/realtime/socket-server");
      const eventPayload = {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
      };
      if (ticket.assignedToId) {
        emitToUser(ticket.assignedToId, "ticket:created", eventPayload);
      }
      if (ticket.teamId) {
        emitToTeam(ticket.teamId, "ticket:created", eventPayload);
      }
    } catch {
      // Socket.io failures must not break API responses
    }

    try {
      await automationQueue.add("automation", {
        ticketId: ticket.id,
        trigger: "TICKET_CREATED",
      });
    } catch {
      // Queue failures must not break API responses
    }

    const ticketUrl = `${process.env.NEXTAUTH_URL ?? ""}/tickets/${ticket.id}`;

    // Email: notify assignee
    if (ticket.assignedTo?.email) {
      await queueEmail({
        type: "ticket_assigned",
        to: ticket.assignedTo.email,
        data: {
          ticketNumber: ticket.id,
          ticketTitle: ticket.title,
          ticketUrl,
          assigneeName: ticket.assignedTo.name ?? ticket.assignedTo.email,
        },
      });
    }

    // Email: notify reporter (if different from assignee)
    if (
      ticket.createdBy?.email &&
      ticket.createdBy.id !== ticket.assignedTo?.id
    ) {
      await queueEmail({
        type: "ticket_created",
        to: ticket.createdBy.email,
        data: {
          ticketNumber: ticket.id,
          ticketTitle: ticket.title,
          ticketUrl,
        },
      });
    }

    return apiSuccess(ticket, {
      status: 201,
      message: "Ticket created successfully",
    });
  } catch (error) {
    console.error("Failed to create ticket:", error);
    if (error instanceof Error && error.message === 'Invalid JSON in request body') {
      return apiError("Bad request", { status: 400, message: error.message });
    }
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to create ticket",
    });
  }
}
