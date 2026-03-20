import { Prisma, PredictionType } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { serializeAIPredictionLog } from "@/lib/ai/serializers";
import { serializeHistoryValue } from "@/lib/ticket-api";
import {
  categoryPredictionOutputSchema,
  predictionAcceptanceSchema,
  priorityPredictionOutputSchema,
  routingPredictionOutputSchema,
} from "@/lib/validators/ai";

type PredictionAcceptRouteContext = {
  params: Promise<{ id: string }>;
};

type TicketApplyState = {
  id: string;
  priority: string;
  category: string | null;
  subcategory: string | null;
  assignedToId: string | null;
  teamId: string | null;
};

type TicketHistoryChange = {
  field: string;
  oldValue: string | null;
  newValue: string | null;
};

async function applyPredictionToTicket({
  tx,
  predictionType,
  output,
  ticket,
  userId,
}: {
  tx: Prisma.TransactionClient;
  predictionType: PredictionType;
  output: Prisma.JsonValue;
  ticket: TicketApplyState;
  userId: string;
}) {
  const changes: TicketHistoryChange[] = [];
  const data: Prisma.TicketUncheckedUpdateInput = {};

  if (predictionType === PredictionType.PRIORITY) {
    const parsed = priorityPredictionOutputSchema.safeParse(output);

    if (!parsed.success) {
      throw new Error("This priority prediction can no longer be applied.");
    }

    if (parsed.data.priority !== ticket.priority) {
      data.priority = parsed.data.priority;
      changes.push({
        field: "priority",
        oldValue: serializeHistoryValue(ticket.priority),
        newValue: serializeHistoryValue(parsed.data.priority),
      });
    }
  }

  if (predictionType === PredictionType.CATEGORY) {
    const parsed = categoryPredictionOutputSchema.safeParse(output);

    if (!parsed.success) {
      throw new Error("This category prediction can no longer be applied.");
    }

    if (parsed.data.category !== ticket.category) {
      data.category = parsed.data.category;
      changes.push({
        field: "category",
        oldValue: serializeHistoryValue(ticket.category),
        newValue: serializeHistoryValue(parsed.data.category),
      });
    }

    if (parsed.data.subcategory !== ticket.subcategory) {
      data.subcategory = parsed.data.subcategory;
      changes.push({
        field: "subcategory",
        oldValue: serializeHistoryValue(ticket.subcategory),
        newValue: serializeHistoryValue(parsed.data.subcategory),
      });
    }
  }

  if (predictionType === PredictionType.ROUTING) {
    const parsed = routingPredictionOutputSchema.safeParse(output);

    if (!parsed.success) {
      throw new Error("This routing prediction can no longer be applied.");
    }

    const nextAssignedToId = parsed.data.suggestedUserId ?? null;
    const nextTeamId = parsed.data.suggestedTeamId ?? null;

    if (nextAssignedToId) {
      const userExists = await tx.user.findFirst({
        where: {
          id: nextAssignedToId,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!userExists) {
        throw new Error("The suggested assignee is no longer available.");
      }
    }

    if (nextTeamId) {
      const teamExists = await tx.team.findUnique({
        where: {
          id: nextTeamId,
        },
        select: {
          id: true,
        },
      });

      if (!teamExists) {
        throw new Error("The suggested team is no longer available.");
      }
    }

    if (nextAssignedToId !== ticket.assignedToId) {
      data.assignedToId = nextAssignedToId;
      changes.push({
        field: "assignedToId",
        oldValue: serializeHistoryValue(ticket.assignedToId),
        newValue: serializeHistoryValue(nextAssignedToId),
      });
    }

    if (nextTeamId !== ticket.teamId) {
      data.teamId = nextTeamId;
      changes.push({
        field: "teamId",
        oldValue: serializeHistoryValue(ticket.teamId),
        newValue: serializeHistoryValue(nextTeamId),
      });
    }
  }

  const shouldUpdateTicket = Object.keys(data).length > 0;

  if (shouldUpdateTicket) {
    await tx.ticket.update({
      where: { id: ticket.id },
      data,
    });
  }

  if (changes.length > 0) {
    await tx.ticketHistory.createMany({
      data: changes.map((change) => ({
        ticketId: ticket.id,
        userId,
        action: "UPDATED",
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
      })),
    });
  }

  return shouldUpdateTicket;
}

export async function POST(
  request: Request,
  context: PredictionAcceptRouteContext
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to accept AI predictions",
    });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = predictionAcceptanceSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const prediction = await db.aIPredictionLog.findUnique({
      where: { id },
    });

    if (!prediction) {
      return apiError("Not found", {
        status: 404,
        message: "Prediction not found",
      });
    }

    const updatedPrediction = await db.$transaction(async (tx) => {
      let applied = false;

      if (validated.data.accepted) {
        const ticket = await tx.ticket.findFirst({
          where: {
            id: prediction.ticketId,
            deletedAt: null,
          },
          select: {
            id: true,
            priority: true,
            category: true,
            subcategory: true,
            assignedToId: true,
            teamId: true,
          },
        });

        if (!ticket) {
          throw new Error("The ticket for this prediction no longer exists.");
        }

        applied = await applyPredictionToTicket({
          tx,
          predictionType: prediction.predictionType,
          output: prediction.output,
          ticket,
          userId: session.user.id,
        });
      }

      const updated = await tx.aIPredictionLog.update({
        where: { id },
        data: {
          wasAccepted: validated.data.accepted,
        },
      });

      return {
        prediction: updated,
        applied,
      };
    });

    return apiSuccess(
      {
        prediction: serializeAIPredictionLog(updatedPrediction.prediction),
        applied: updatedPrediction.applied,
      },
      {
        message: validated.data.accepted
          ? "Prediction processed successfully"
          : "Prediction dismissed successfully",
      }
    );
  } catch (error) {
    console.error("Failed to process prediction acceptance:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to process the prediction",
    });
  }
}
