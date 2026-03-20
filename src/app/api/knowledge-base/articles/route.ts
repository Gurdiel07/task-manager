import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import {
  createKBArticleSchema,
  kbArticleListQuerySchema,
} from "@/lib/validators/knowledge-base";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = kbArticleListQuerySchema.safeParse(query);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { status, categoryId, search, page, limit } = validated.data;
    const where: Prisma.KBArticleWhereInput = {};

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await db.$transaction([
      db.kBArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
          author: { select: { id: true, name: true, email: true } },
          viewCount: true,
          helpfulCount: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      db.kBArticle.count({ where }),
    ]);

    return apiSuccess({
      articles,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Failed to fetch KB articles:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch articles" });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "You must be signed in" });
  }

  if (user.role === "CUSTOMER") {
    return apiError("Forbidden", { status: 403, message: "Insufficient permissions to create articles" });
  }

  try {
    const body = await request.json();
    const validated = createKBArticleSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { status, ...articleData } = validated.data;
    const article = await db.kBArticle.create({
      data: {
        ...articleData,
        status: status ?? "DRAFT",
        authorId: user.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, email: true } },
        viewCount: true,
        helpfulCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess(article, { status: 201, message: "Article created successfully" });
  } catch (error) {
    console.error("Failed to create KB article:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to create article" });
  }
}
