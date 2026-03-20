import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  createWorkflowStepSchema,
  bulkUpdateStepsSchema,
} from "@/lib/validators/workflow";
import type { Prisma } from "@/generated/prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await context.params;

    const steps = await db.workflowStep.findMany({
      where: { templateId: id },
      orderBy: { order: "asc" },
    });

    return apiSuccess(steps);
  } catch (error) {
    console.error("Failed to fetch steps:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch workflow steps",
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
    const validated = createWorkflowStepSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const template = await db.workflowTemplate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!template) {
      return apiError("Not found", {
        status: 404,
        message: "Workflow template not found",
      });
    }

    let order = validated.data.order;
    if (order === undefined) {
      const maxStep = await db.workflowStep.findFirst({
        where: { templateId: id },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = maxStep ? maxStep.order + 1 : 0;
    }

    const step = await db.workflowStep.create({
      data: {
        templateId: id,
        name: validated.data.name,
        description: validated.data.description,
        type: validated.data.type ?? "MANUAL",
        config: (validated.data.config ?? undefined) as Prisma.InputJsonValue | undefined,
        positionX: validated.data.positionX ?? 0,
        positionY: validated.data.positionY ?? 0,
        order,
      },
    });

    return apiSuccess(step, { status: 201, message: "Step created" });
  } catch (error) {
    console.error("Failed to create step:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to create workflow step",
    });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = bulkUpdateStepsSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    await db.$transaction(
      validated.data.map((step) =>
        db.workflowStep.update({
          where: { id: step.id },
          data: {
            name: step.name ?? undefined,
            description: step.description,
            type: step.type ?? undefined,
            config: step.config as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined,
            positionX: step.positionX ?? undefined,
            positionY: step.positionY ?? undefined,
            order: step.order ?? undefined,
          },
        })
      )
    );

    const steps = await db.workflowStep.findMany({
      where: { templateId: id },
      orderBy: { order: "asc" },
    });

    return apiSuccess(steps, { message: "Steps updated" });
  } catch (error) {
    console.error("Failed to update steps:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to update workflow steps",
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
    const stepId = request.nextUrl.searchParams.get("stepId");

    if (!stepId) {
      return apiError("Missing stepId", {
        status: 400,
        message: "stepId query parameter is required",
      });
    }

    const step = await db.workflowStep.findFirst({
      where: { id: stepId, templateId: id },
    });

    if (!step) {
      return apiError("Not found", {
        status: 404,
        message: "Step not found in this template",
      });
    }

    await db.$transaction([
      db.workflowTransition.deleteMany({
        where: {
          templateId: id,
          OR: [{ fromStepId: stepId }, { toStepId: stepId }],
        },
      }),
      db.workflowStep.delete({ where: { id: stepId } }),
    ]);

    return apiSuccess(null, { message: "Step deleted" });
  } catch (error) {
    console.error("Failed to delete step:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to delete workflow step",
    });
  }
}
