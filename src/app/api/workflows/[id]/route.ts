import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { updateWorkflowTemplateSchema } from "@/lib/validators/workflow";

type RouteContext = { params: Promise<{ id: string }> };

const userSelect = { id: true, name: true, email: true, image: true };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await context.params;

    const template = await db.workflowTemplate.findFirst({
      where: { id, deletedAt: null },
      include: {
        steps: { orderBy: { order: "asc" } },
        transitions: true,
        createdBy: { select: userSelect },
        _count: {
          select: {
            steps: true,
            instances: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    if (!template) {
      return apiError("Not found", {
        status: 404,
        message: "Workflow template not found",
      });
    }

    return apiSuccess(template);
  } catch (error) {
    console.error("Failed to fetch workflow:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch workflow template",
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
    const validated = updateWorkflowTemplateSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const existing = await db.workflowTemplate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return apiError("Not found", {
        status: 404,
        message: "Workflow template not found",
      });
    }

    const template = await db.workflowTemplate.update({
      where: { id },
      data: validated.data,
      include: {
        steps: { orderBy: { order: "asc" } },
        transitions: true,
        createdBy: { select: userSelect },
        _count: {
          select: {
            steps: true,
            instances: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    return apiSuccess(template, { message: "Workflow template updated" });
  } catch (error) {
    console.error("Failed to update workflow:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to update workflow template",
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await context.params;

    const template = await db.workflowTemplate.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { instances: { where: { status: "ACTIVE" } } },
        },
      },
    });

    if (!template) {
      return apiError("Not found", {
        status: 404,
        message: "Workflow template not found",
      });
    }

    if (template._count.instances > 0) {
      return apiError("Cannot delete", {
        status: 409,
        message:
          "Cannot delete a template with active instances. Cancel or complete all instances first.",
      });
    }

    await db.workflowTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess(null, { message: "Workflow template deleted" });
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to delete workflow template",
    });
  }
}
