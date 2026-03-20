import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { SLABreachType } from "@/generated/prisma/client";

const checkSLASchema = z.object({
  ticketId: z.string().min(1, "ticketId is required"),
});

function policyMatchesTicket(
  conditions: Record<string, unknown>,
  ticket: { priority: string | null; category: string | null; teamId: string | null }
): boolean {
  if (Object.keys(conditions).length === 0) return true;

  if (conditions.priority && conditions.priority !== ticket.priority) return false;
  if (conditions.category && conditions.category !== ticket.category) return false;
  if (conditions.teamId && conditions.teamId !== ticket.teamId) return false;

  return true;
}

export async function POST(request: Request) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  try {
    const body = await request.json();
    const validated = checkSLASchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { ticketId } = validated.data;

    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        createdAt: true,
        firstResponseAt: true,
        resolvedAt: true,
        priority: true,
        category: true,
        teamId: true,
      },
    });

    if (!ticket) {
      return apiError("Not found", { status: 404, message: "Ticket not found" });
    }

    const activePolicies = await db.sLAPolicy.findMany({
      where: { isActive: true },
    });

    const now = new Date();
    const createdAt = new Date(ticket.createdAt);
    const elapsedMin = (now.getTime() - createdAt.getTime()) / 60000;

    const existingBreaches = await db.sLABreach.findMany({
      where: { ticketId },
      select: { policyId: true, type: true },
    });
    const existingSet = new Set(
      existingBreaches.map((b) => `${b.policyId}:${b.type}`)
    );

    const newBreaches: {
      ticketId: string;
      policyId: string;
      type: SLABreachType;
      breachedAt: Date;
    }[] = [];

    for (const policy of activePolicies) {
      const conditions = (policy.conditions ?? {}) as Record<string, unknown>;
      if (!policyMatchesTicket(conditions, ticket)) continue;

      if (
        !ticket.firstResponseAt &&
        elapsedMin > policy.responseTimeMin &&
        !existingSet.has(`${policy.id}:FIRST_RESPONSE`)
      ) {
        newBreaches.push({
          ticketId,
          policyId: policy.id,
          type: SLABreachType.FIRST_RESPONSE,
          breachedAt: new Date(createdAt.getTime() + policy.responseTimeMin * 60000),
        });
      }

      if (
        !ticket.resolvedAt &&
        elapsedMin > policy.resolutionMin &&
        !existingSet.has(`${policy.id}:RESOLUTION`)
      ) {
        newBreaches.push({
          ticketId,
          policyId: policy.id,
          type: SLABreachType.RESOLUTION,
          breachedAt: new Date(createdAt.getTime() + policy.resolutionMin * 60000),
        });
      }
    }

    if (newBreaches.length > 0) {
      await db.sLABreach.createMany({ data: newBreaches });
    }

    const createdBreaches = await db.sLABreach.findMany({
      where: {
        ticketId,
        breachedAt: { in: newBreaches.map((b) => b.breachedAt) },
      },
      include: {
        ticket: { select: { id: true, number: true, title: true } },
        policy: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({
      breachesCreated: createdBreaches.length,
      breaches: createdBreaches,
    });
  } catch (error) {
    console.error("Failed to check SLA:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to check SLA compliance" });
  }
}
