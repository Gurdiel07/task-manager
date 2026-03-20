import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  getSessionUser,
  getTaskOrderBy,
  getTaskWhere,
  taskListInclude,
} from "@/lib/task-api";
import { createTaskSchema, taskListQuerySchema } from "@/lib/validators/task";

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view tasks",
    });
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = taskListQuerySchema.safeParse(query);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const filters = validated.data;
    const where = getTaskWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [tasks, total] = await db.$transaction([
      db.task.findMany({
        where,
        include: taskListInclude,
        orderBy: getTaskOrderBy(filters.sort, filters.order),
        skip,
        take: filters.limit,
      }),
      db.task.count({ where }),
    ]);

    return apiSuccess({
      tasks,
      total,
      page: filters.page,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch tasks",
    });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to create tasks",
    });
  }

  try {
    const body = await request.json();
    const validated = createTaskSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const payload = validated.data;

    const task = await db.task.create({
      data: {
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        ticketId: payload.ticketId || undefined,
        workflowInstanceStepId: payload.workflowInstanceStepId || undefined,
        assignedToId: payload.assignedToId || undefined,
        dueDate: payload.dueDate,
        estimatedHours: payload.estimatedHours,
        createdById: user.id,
      },
      include: taskListInclude,
    });

    return apiSuccess(task, {
      status: 201,
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Failed to create task:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to create task",
    });
  }
}
