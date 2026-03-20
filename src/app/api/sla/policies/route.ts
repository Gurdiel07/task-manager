import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { createSLAPolicySchema } from "@/lib/validators/sla";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  try {
    const isActiveParam = request.nextUrl.searchParams.get("isActive");
    const where: Prisma.SLAPolicyWhereInput = {};

    if (isActiveParam !== null) {
      where.isActive = isActiveParam === "true";
    }

    const policies = await db.sLAPolicy.findMany({
      where,
      include: {
        _count: { select: { breaches: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(policies);
  } catch (error) {
    console.error("Failed to fetch SLA policies:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch SLA policies" });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    return apiError("Forbidden", { status: 403, message: "Only admins and managers can create SLA policies" });
  }

  try {
    const body = await request.json();
    const validated = createSLAPolicySchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { conditions, isActive, ...rest } = validated.data;
    const policy = await db.sLAPolicy.create({
      data: {
        ...rest,
        isActive: isActive ?? true,
        conditions: (conditions ?? {}) as Prisma.InputJsonValue,
      },
      include: {
        _count: { select: { breaches: true } },
      },
    });

    return apiSuccess(policy, { status: 201, message: "SLA policy created successfully" });
  } catch (error) {
    console.error("Failed to create SLA policy:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to create SLA policy" });
  }
}
