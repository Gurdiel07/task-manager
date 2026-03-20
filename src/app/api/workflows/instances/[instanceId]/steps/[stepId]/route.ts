import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { stepActionSchema } from "@/lib/validators/workflow";
import {
  completeStep,
  skipStep,
  failStep,
  advanceToStep,
} from "@/lib/workflow-engine";

type RouteContext = {
  params: Promise<{ instanceId: string; stepId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { instanceId, stepId } = await context.params;
    const body = await request.json();
    const validated = stepActionSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const action = validated.data;
    let instance;

    switch (action.action) {
      case "complete":
        instance = await completeStep(
          instanceId,
          stepId,
          session.user.id,
          action.data
        );
        break;

      case "skip":
        instance = await skipStep(instanceId, stepId, session.user.id);
        break;

      case "fail":
        instance = await failStep(
          instanceId,
          stepId,
          session.user.id,
          action.data.reason
        );
        break;

      case "assign": {
        const instanceStep = await db.workflowInstanceStep.findFirst({
          where: { instanceId, stepId },
        });

        if (!instanceStep) {
          return apiError("Not found", {
            status: 404,
            message: "Instance step not found",
          });
        }

        await db.workflowInstanceStep.update({
          where: { id: instanceStep.id },
          data: { assignedToId: action.assignedToId },
        });

        instance = await db.workflowInstance.findUniqueOrThrow({
          where: { id: instanceId },
          include: {
            steps: {
              include: {
                step: true,
                assignedTo: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
              orderBy: { step: { order: "asc" } },
            },
            template: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
              },
            },
            ticket: { select: { id: true, number: true, title: true } },
            snapshots: {
              include: {
                createdBy: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        });
        break;
      }

      case "advance":
        instance = await advanceToStep(
          instanceId,
          action.targetStepId,
          session.user.id
        );
        break;
    }

    return apiSuccess(instance, {
      message: `Step ${action.action} successful`,
    });
  } catch (error) {
    console.error("Failed to update step:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update workflow step",
    });
  }
}
