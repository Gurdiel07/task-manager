import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser, taskDetailInclude } from "@/lib/task-api";
import { updateTaskSchema } from "@/lib/validators/task";

type TaskRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: TaskRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view task details",
    });
  }

  try {
    const { id } = await context.params;

    const task = await db.task.findFirst({
      where: { id, deletedAt: null },
      include: taskDetailInclude,
    });

    if (!task || (user.role === "CUSTOMER" && task.createdById !== user.id && task.assignedToId !== user.id)) {
      return apiError("Not found", {
        status: 404,
        message: "Task not found",
      });
    }

    return apiSuccess(task);
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch task details",
    });
  }
}

export async function PUT(request: Request, context: TaskRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to update tasks",
    });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateTaskSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const existingTask = await db.task.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, createdById: true, assignedToId: true },
    });

    if (!existingTask || (user.role === "CUSTOMER" && existingTask.createdById !== user.id && existingTask.assignedToId !== user.id)) {
      return apiError("Not found", {
        status: 404,
        message: "Task not found",
      });
    }

    const data = validated.data;

    let completedAt: Date | null | undefined;
    if (data.status === "DONE" && existingTask.status !== "DONE") {
      completedAt = new Date();
    } else if (
      data.status &&
      data.status !== "DONE" &&
      existingTask.status === "DONE"
    ) {
      completedAt = null;
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
    if (completedAt !== undefined) updateData.completedAt = completedAt;

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: taskDetailInclude,
    });

    return apiSuccess(task, { message: "Task updated successfully" });
  } catch (error) {
    console.error("Failed to update task:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to update task",
    });
  }
}

export async function DELETE(_request: Request, context: TaskRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to delete tasks",
    });
  }

  try {
    const { id } = await context.params;

    const taskToDelete = await db.task.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, createdById: true, assignedToId: true },
    });

    if (!taskToDelete || (user.role === "CUSTOMER" && taskToDelete.createdById !== user.id && taskToDelete.assignedToId !== user.id)) {
      return apiError("Not found", {
        status: 404,
        message: "Task not found",
      });
    }

    await db.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return apiSuccess(null, { message: "Task deleted successfully" });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to delete task",
    });
  }
}
