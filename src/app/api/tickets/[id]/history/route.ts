import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser, ticketHistoryInclude } from "@/lib/ticket-api";

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view ticket history",
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

    const history = await db.ticketHistory.findMany({
      where: {
        ticketId: id,
      },
      include: ticketHistoryInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return apiSuccess(history);
  } catch (error) {
    console.error("Failed to fetch ticket history:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch ticket history",
    });
  }
}
