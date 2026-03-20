import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { Prisma } from "@/generated/prisma/client";

const breachQuerySchema = z.object({
  ticketId: z.string().optional(),
  policyId: z.string().optional(),
  type: z.enum(["FIRST_RESPONSE", "RESOLUTION"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = breachQuerySchema.safeParse(query);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { ticketId, policyId, type, page, limit } = validated.data;
    const where: Prisma.SLABreachWhereInput = {};

    if (ticketId) where.ticketId = ticketId;
    if (policyId) where.policyId = policyId;
    if (type) where.type = type;

    const skip = (page - 1) * limit;

    const [breaches, total] = await db.$transaction([
      db.sLABreach.findMany({
        where,
        include: {
          ticket: { select: { id: true, number: true, title: true } },
          policy: { select: { id: true, name: true } },
        },
        orderBy: { breachedAt: "desc" },
        skip,
        take: limit,
      }),
      db.sLABreach.count({ where }),
    ]);

    return apiSuccess({
      breaches,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Failed to fetch SLA breaches:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch SLA breaches" });
  }
}
