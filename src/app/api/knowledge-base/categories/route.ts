import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { createKBCategorySchema } from "@/lib/validators/knowledge-base";

export async function GET() {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  try {
    const categories = await db.kBCategory.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { articles: true } },
        children: {
          include: {
            _count: { select: { articles: true } },
            children: {
              include: { _count: { select: { articles: true } } },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return apiSuccess(categories);
  } catch (error) {
    console.error("Failed to fetch KB categories:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch categories" });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role === "CUSTOMER") {
    return apiError("Forbidden", { status: 403, message: "Insufficient permissions to create categories" });
  }

  try {
    const body = await request.json();
    const validated = createKBCategorySchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const category = await db.kBCategory.create({
      data: validated.data,
      include: { _count: { select: { articles: true } } },
    });

    return apiSuccess(category, { status: 201, message: "Category created successfully" });
  } catch (error) {
    console.error("Failed to create KB category:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to create category" });
  }
}
