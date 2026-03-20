import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createWorkflowTransitionSchema } from "@/lib/validators/workflow";
import type { Prisma } from "@/generated/prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await context.params;

    const transitions = await db.workflowTransition.findMany({
      where: { templateId: id },
    });

    return apiSuccess(transitions);
  } catch (error) {
    console.error("Failed to fetch transitions:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch workflow transitions",
    });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = createWorkflowTransitionSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const [fromStep, toStep] = await Promise.all([
      db.workflowStep.findFirst({
        where: { id: validated.data.fromStepId, templateId: id },
      }),
      db.workflowStep.findFirst({
        where: { id: validated.data.toStepId, templateId: id },
      }),
    ]);

    if (!fromStep || !toStep) {
      return apiError("Invalid steps", {
        status: 400,
        message: "Both steps must belong to this template",
      });
    }

    const transition = await db.workflowTransition.create({
      data: {
        templateId: id,
        fromStepId: validated.data.fromStepId,
        toStepId: validated.data.toStepId,
        label: validated.data.label,
        condition: (validated.data.condition ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    return apiSuccess(transition, {
      status: 201,
      message: "Transition created",
    });
  } catch (error) {
    console.error("Failed to create transition:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to create workflow transition",
    });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await context.params;
    const transitionId = request.nextUrl.searchParams.get("transitionId");

    if (!transitionId) {
      return apiError("Missing transitionId", {
        status: 400,
        message: "transitionId query parameter is required",
      });
    }

    const transition = await db.workflowTransition.findFirst({
      where: { id: transitionId, templateId: id },
    });

    if (!transition) {
      return apiError("Not found", {
        status: 404,
        message: "Transition not found in this template",
      });
    }

    await db.workflowTransition.delete({ where: { id: transitionId } });

    return apiSuccess(null, { message: "Transition deleted" });
  } catch (error) {
    console.error("Failed to delete transition:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to delete workflow transition",
    });
  }
}
