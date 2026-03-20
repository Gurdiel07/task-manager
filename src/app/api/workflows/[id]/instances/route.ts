import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createWorkflowInstanceSchema } from "@/lib/validators/workflow";
import { startWorkflow } from "@/lib/workflow-engine";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await context.params;

    const instances = await db.workflowInstance.findMany({
      where: { templateId: id },
      include: {
        ticket: { select: { id: true, number: true, title: true } },
      },
      orderBy: { startedAt: "desc" },
    });

    const stepIds = instances
      .map((i) => i.currentStepId)
      .filter((id): id is string => id !== null);

    const steps =
      stepIds.length > 0
        ? await db.workflowStep.findMany({
            where: { id: { in: stepIds } },
            select: { id: true, name: true },
          })
        : [];

    const stepMap = new Map(steps.map((s) => [s.id, s]));

    const result = instances.map((instance) => ({
      ...instance,
      currentStep: instance.currentStepId
        ? stepMap.get(instance.currentStepId) ?? null
        : null,
    }));

    return apiSuccess(result);
  } catch (error) {
    console.error("Failed to fetch instances:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch workflow instances",
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
    const validated = createWorkflowInstanceSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const template = await db.workflowTemplate.findFirst({
      where: { id, deletedAt: null, isActive: true },
    });

    if (!template) {
      return apiError("Not found", {
        status: 404,
        message: "Active workflow template not found",
      });
    }

    const instance = await startWorkflow(
      id,
      validated.data.ticketId,
      session.user.id
    );

    return apiSuccess(instance, {
      status: 201,
      message: "Workflow instance started",
    });
  } catch (error) {
    console.error("Failed to start workflow:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to start workflow instance",
    });
  }
}
