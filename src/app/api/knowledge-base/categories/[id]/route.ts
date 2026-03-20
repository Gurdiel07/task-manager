import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { updateKBCategorySchema } from "@/lib/validators/knowledge-base";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  const { id } = await params;

  try {
    const category = await db.kBCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { articles: true } },
        children: {
          include: { _count: { select: { articles: true } } },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!category) {
      return apiError("Not found", { status: 404, message: "Category not found" });
    }

    return apiSuccess(category);
  } catch (error) {
    console.error("Failed to fetch KB category:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch category" });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role === "CUSTOMER") {
    return apiError("Forbidden", { status: 403, message: "Insufficient permissions" });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = updateKBCategorySchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const existing = await db.kBCategory.findUnique({ where: { id } });
    if (!existing) {
      return apiError("Not found", { status: 404, message: "Category not found" });
    }

    const category = await db.kBCategory.update({
      where: { id },
      data: validated.data,
      include: { _count: { select: { articles: true } } },
    });

    return apiSuccess(category);
  } catch (error) {
    console.error("Failed to update KB category:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to update category" });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    return apiError("Forbidden", { status: 403, message: "Insufficient permissions" });
  }

  const { id } = await params;

  try {
    const category = await db.kBCategory.findUnique({
      where: { id },
      include: { _count: { select: { articles: true } } },
    });

    if (!category) {
      return apiError("Not found", { status: 404, message: "Category not found" });
    }

    if (category._count.articles > 0) {
      return apiError("Conflict", {
        status: 409,
        message: "Cannot delete category with existing articles",
      });
    }

    await db.kBCategory.delete({ where: { id } });

    return apiSuccess(null, { message: "Category deleted successfully" });
  } catch (error) {
    console.error("Failed to delete KB category:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to delete category" });
  }
}
