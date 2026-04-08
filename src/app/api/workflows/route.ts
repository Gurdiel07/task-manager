import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  createWorkflowTemplateSchema,
  workflowListQuerySchema,
} from "@/lib/validators/workflow";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = workflowListQuerySchema.safeParse(query);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const filters = validated.data;
    const where: Prisma.WorkflowTemplateWhereInput = { deletedAt: null };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isActive === "true") {
      where.isActive = true;
    } else if (filters.isActive === "false") {
      where.isActive = false;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [templates, total] = await db.$transaction([
      db.workflowTemplate.findMany({
        where,
        include: {
          _count: {
            select: {
              steps: true,
              instances: { where: { status: "ACTIVE" } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: filters.limit,
      }),
      db.workflowTemplate.count({ where }),
    ]);

    return apiSuccess({
      templates,
      total,
      page: filters.page,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    });
  } catch (error) {
    console.error("Failed to fetch workflows:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch workflows",
    });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createWorkflowTemplateSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const template = await db.workflowTemplate.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        category: validated.data.category,
        createdById: session.user.id,
      },
      include: {
        _count: {
          select: {
            steps: true,
            instances: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    return apiSuccess(template, {
      status: 201,
      message: "Workflow template created",
    });
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to create workflow template",
    });
  }
}
