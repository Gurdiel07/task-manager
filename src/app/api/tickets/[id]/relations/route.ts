import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  getSessionUser,
  mapTicketRelations,
  ticketRelationInclude,
} from "@/lib/ticket-api";
import { ticketRelationSchema } from "@/lib/validators/ticket";

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view ticket relations",
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

    const relations = await db.ticketRelation.findMany({
      where: {
        OR: [{ sourceTicketId: id }, { targetTicketId: id }],
      },
      include: ticketRelationInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return apiSuccess(mapTicketRelations(id, relations));
  } catch (error) {
    console.error("Failed to fetch ticket relations:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch ticket relations",
    });
  }
}

export async function POST(request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to relate tickets",
    });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = ticketRelationSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    if (validated.data.targetTicketId === id) {
      return apiError("Validation failed", {
        status: 400,
        message: "A ticket cannot be related to itself",
      });
    }

    const [sourceTicket, targetTicket] = await db.$transaction([
      db.ticket.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: { id: true },
      }),
      db.ticket.findFirst({
        where: {
          id: validated.data.targetTicketId,
          deletedAt: null,
        },
        select: { id: true },
      }),
    ]);

    if (!sourceTicket || !targetTicket) {
      return apiError("Not found", {
        status: 404,
        message: "One or both tickets could not be found",
      });
    }

    const relation = await db.ticketRelation.create({
      data: {
        sourceTicketId: id,
        targetTicketId: validated.data.targetTicketId,
        type: validated.data.type,
      },
      include: ticketRelationInclude,
    });

    return apiSuccess(mapTicketRelations(id, [relation])[0], {
      status: 201,
      message: "Relation created successfully",
    });
  } catch (error) {
    console.error("Failed to create ticket relation:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to create ticket relation",
    });
  }
}

export async function DELETE(request: NextRequest, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to remove ticket relations",
    });
  }

  try {
    const { id } = await context.params;
    const relationId = request.nextUrl.searchParams.get("relationId");

    if (!relationId) {
      return apiError("Validation failed", {
        status: 400,
        message: "relationId is required",
      });
    }

    const deletedRelation = await db.ticketRelation.deleteMany({
      where: {
        id: relationId,
        OR: [{ sourceTicketId: id }, { targetTicketId: id }],
      },
    });

    if (deletedRelation.count === 0) {
      return apiError("Not found", {
        status: 404,
        message: "Relation not found",
      });
    }

    return apiSuccess(null, {
      message: "Relation removed successfully",
    });
  } catch (error) {
    console.error("Failed to delete ticket relation:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to remove ticket relation",
    });
  }
}
