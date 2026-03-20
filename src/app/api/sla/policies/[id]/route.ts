import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { updateSLAPolicySchema } from "@/lib/validators/sla";
import { Prisma } from "@/generated/prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  const { id } = await params;

  try {
    const policy = await db.sLAPolicy.findUnique({
      where: { id },
      include: { _count: { select: { breaches: true } } },
    });

    if (!policy) {
      return apiError("Not found", { status: 404, message: "SLA policy not found" });
    }

    return apiSuccess(policy);
  } catch (error) {
    console.error("Failed to fetch SLA policy:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch SLA policy" });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    return apiError("Forbidden", { status: 403, message: "Only admins and managers can update SLA policies" });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = updateSLAPolicySchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const existing = await db.sLAPolicy.findUnique({ where: { id } });
    if (!existing) {
      return apiError("Not found", { status: 404, message: "SLA policy not found" });
    }

    const { conditions, ...rest } = validated.data;
    const updateData: Prisma.SLAPolicyUpdateInput = { ...rest };
    if (conditions !== undefined) {
      updateData.conditions = conditions as Prisma.InputJsonValue;
    }

    const policy = await db.sLAPolicy.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { breaches: true } } },
    });

    return apiSuccess(policy);
  } catch (error) {
    console.error("Failed to update SLA policy:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to update SLA policy" });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN") {
    return apiError("Forbidden", { status: 403, message: "Only admins can delete SLA policies" });
  }

  const { id } = await params;

  try {
    const policy = await db.sLAPolicy.findUnique({
      where: { id },
      include: { _count: { select: { breaches: true } } },
    });

    if (!policy) {
      return apiError("Not found", { status: 404, message: "SLA policy not found" });
    }

    if (policy._count.breaches > 0) {
      return apiError("Conflict", {
        status: 409,
        message: "Cannot delete policy with existing breaches",
      });
    }

    await db.sLAPolicy.delete({ where: { id } });

    return apiSuccess(null, { message: "SLA policy deleted successfully" });
  } catch (error) {
    console.error("Failed to delete SLA policy:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to delete SLA policy" });
  }
}
