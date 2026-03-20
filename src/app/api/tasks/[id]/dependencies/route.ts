import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/task-api";
import { addDependencySchema } from "@/lib/validators/task";

type DependencyRouteContext = {
  params: Promise<{ id: string }>;
};

async function wouldCreateCycle(
  taskId: string,
  dependsOnId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const queue: string[] = [dependsOnId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === taskId) return true;
    if (visited.has(current)) continue;

    visited.add(current);

    const deps = await db.taskDependency.findMany({
      where: { taskId: current },
      select: { dependsOnId: true },
    });

    for (const dep of deps) {
      queue.push(dep.dependsOnId);
    }
  }

  return false;
}

export async function GET(_request: Request, context: DependencyRouteContext) {
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

    const [dependencies, dependents] = await db.$transaction([
      db.taskDependency.findMany({
        where: { taskId },
        include: {
          dependsOn: { select: { id: true, title: true, status: true } },
        },
      }),
      db.taskDependency.findMany({
        where: { dependsOnId: taskId },
        include: {
          task: { select: { id: true, title: true, status: true } },
        },
      }),
    ]);

    return apiSuccess({ dependencies, dependents });
  } catch (error) {
    console.error("Failed to fetch dependencies:", error);
    return apiError("Internal server error", { status: 500 });
  }
}

export async function POST(request: Request, context: DependencyRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id: taskId } = await context.params;
    const body = await request.json();
    const validated = addDependencySchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { dependsOnId } = validated.data;

    if (taskId === dependsOnId) {
      return apiError("Invalid dependency", {
        status: 400,
        message: "A task cannot depend on itself",
      });
    }

    const task = await db.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true },
    });

    if (!task) {
      return apiError("Not found", { status: 404, message: "Task not found" });
    }

    const dependsOnTask = await db.task.findFirst({
      where: { id: dependsOnId, deletedAt: null },
      select: { id: true },
    });

    if (!dependsOnTask) {
      return apiError("Not found", {
        status: 404,
        message: "Dependency task not found",
      });
    }

    const existing = await db.taskDependency.findUnique({
      where: { taskId_dependsOnId: { taskId, dependsOnId } },
    });

    if (existing) {
      return apiError("Conflict", {
        status: 409,
        message: "This dependency already exists",
      });
    }

    const isCyclic = await wouldCreateCycle(taskId, dependsOnId);
    if (isCyclic) {
      return apiError("Circular dependency detected", {
        status: 400,
        message:
          "Adding this dependency would create a circular dependency chain",
      });
    }

    const dependency = await db.taskDependency.create({
      data: { taskId, dependsOnId },
      include: {
        dependsOn: { select: { id: true, title: true, status: true } },
      },
    });

    return apiSuccess(dependency, { status: 201 });
  } catch (error) {
    console.error("Failed to add dependency:", error);
    return apiError("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: DependencyRouteContext
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id: taskId } = await context.params;
    const dependencyId = request.nextUrl.searchParams.get("dependencyId");

    if (!dependencyId) {
      return apiError("Bad request", {
        status: 400,
        message: "dependencyId query parameter is required",
      });
    }

    const result = await db.taskDependency.deleteMany({
      where: { id: dependencyId, taskId },
    });

    if (result.count === 0) {
      return apiError("Not found", {
        status: 404,
        message: "Dependency not found",
      });
    }

    return apiSuccess(null, { message: "Dependency removed" });
  } catch (error) {
    console.error("Failed to remove dependency:", error);
    return apiError("Internal server error", { status: 500 });
  }
}
