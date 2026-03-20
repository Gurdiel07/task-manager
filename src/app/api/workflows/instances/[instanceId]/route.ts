import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { instanceActionSchema } from "@/lib/validators/workflow";
import {
  pauseWorkflow,
  resumeWorkflow,
  cancelWorkflow,
} from "@/lib/workflow-engine";

type RouteContext = { params: Promise<{ instanceId: string }> };

const userSelect = { id: true, name: true, email: true, image: true };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { instanceId } = await context.params;

    const instance = await db.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        template: {
          select: { id: true, name: true, description: true, category: true },
        },
        ticket: { select: { id: true, number: true, title: true } },
        steps: {
          include: {
            step: true,
            assignedTo: { select: userSelect },
          },
          orderBy: { step: { order: "asc" } },
        },
        snapshots: {
          include: { createdBy: { select: userSelect } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!instance) {
      return apiError("Not found", {
        status: 404,
        message: "Workflow instance not found",
      });
    }

    return apiSuccess(instance);
  } catch (error) {
    console.error("Failed to fetch instance:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch workflow instance",
    });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { instanceId } = await context.params;
    const body = await request.json();
    const validated = instanceActionSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const existing = await db.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!existing) {
      return apiError("Not found", {
        status: 404,
        message: "Workflow instance not found",
      });
    }

    let instance;

    switch (validated.data.action) {
      case "pause":
        if (existing.status !== "ACTIVE") {
          return apiError("Invalid state", {
            status: 409,
            message: "Only active workflows can be paused",
          });
        }
        instance = await pauseWorkflow(instanceId, session.user.id);
        break;
      case "resume":
        if (existing.status !== "PAUSED") {
          return apiError("Invalid state", {
            status: 409,
            message: "Only paused workflows can be resumed",
          });
        }
        instance = await resumeWorkflow(instanceId, session.user.id);
        break;
      case "cancel":
        if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
          return apiError("Invalid state", {
            status: 409,
            message: "Workflow is already completed or cancelled",
          });
        }
        instance = await cancelWorkflow(instanceId, session.user.id);
        break;
    }

    return apiSuccess(instance, {
      message: `Workflow ${validated.data.action}d successfully`,
    });
  } catch (error) {
    console.error("Failed to update instance:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to update workflow instance",
    });
  }
}
