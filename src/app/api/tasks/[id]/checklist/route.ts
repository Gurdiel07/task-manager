import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/task-api";
import {
  bulkReorderChecklistSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from "@/lib/validators/task";

type ChecklistRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ChecklistRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id: taskId } = await context.params;

    const task = await db.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true },
    });

    if (!task) {
      return apiError("Not found", { status: 404, message: "Task not found" });
    }

    const items = await db.taskChecklist.findMany({
      where: { taskId },
      orderBy: { order: "asc" },
    });

    return apiSuccess(items);
  } catch (error) {
    console.error("Failed to fetch checklist:", error);
    return apiError("Internal server error", { status: 500 });
  }
}

export async function POST(request: Request, context: ChecklistRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id: taskId } = await context.params;

    const task = await db.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true },
    });

    if (!task) {
      return apiError("Not found", { status: 404, message: "Task not found" });
    }

    const body = await request.json();
    const validated = createChecklistItemSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    let order = validated.data.order;
    if (order === undefined) {
      const maxItem = await db.taskChecklist.findFirst({
        where: { taskId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (maxItem?.order ?? -1) + 1;
    }

    const item = await db.taskChecklist.create({
      data: {
        taskId,
        title: validated.data.title,
        order,
      },
    });

    return apiSuccess(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create checklist item:", error);
    return apiError("Internal server error", { status: 500 });
  }
}

export async function PUT(request: Request, context: ChecklistRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id: taskId } = await context.params;

    const task = await db.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true },
    });

    if (!task) {
      return apiError("Not found", { status: 404, message: "Task not found" });
    }

    const body = await request.json();

    if (Array.isArray(body)) {
      const validated = bulkReorderChecklistSchema.safeParse(body);

      if (!validated.success) {
        return apiError("Validation failed", {
          status: 400,
          message: validated.error.issues.map((i) => i.message).join(", "),
        });
      }

      await db.$transaction(
        validated.data.map((item) =>
          db.taskChecklist.update({
            where: { id: item.id, taskId },
            data: { order: item.order },
          })
        )
      );

      const items = await db.taskChecklist.findMany({
        where: { taskId },
        orderBy: { order: "asc" },
      });

      return apiSuccess(items);
    } else {
      const validated = updateChecklistItemSchema.safeParse(body);

      if (!validated.success) {
        return apiError("Validation failed", {
          status: 400,
          message: validated.error.issues.map((i) => i.message).join(", "),
        });
      }

      const { id, ...updateData } = validated.data;

      const item = await db.taskChecklist.update({
        where: { id, taskId },
        data: updateData,
      });

      return apiSuccess(item);
    }
  } catch (error) {
    console.error("Failed to update checklist item:", error);
    return apiError("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: ChecklistRouteContext
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id: taskId } = await context.params;
    const itemId = request.nextUrl.searchParams.get("itemId");

    if (!itemId) {
      return apiError("Bad request", {
        status: 400,
        message: "itemId query parameter is required",
      });
    }

    const result = await db.taskChecklist.deleteMany({
      where: { id: itemId, taskId },
    });

    if (result.count === 0) {
      return apiError("Not found", {
        status: 404,
        message: "Checklist item not found",
      });
    }

    return apiSuccess(null, { message: "Checklist item deleted" });
  } catch (error) {
    console.error("Failed to delete checklist item:", error);
    return apiError("Internal server error", { status: 500 });
  }
}
