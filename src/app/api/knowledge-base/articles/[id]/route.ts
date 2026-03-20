import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { updateKBArticleSchema } from "@/lib/validators/knowledge-base";

const articleDetailSelect = {
  id: true,
  title: true,
  content: true,
  status: true,
  categoryId: true,
  category: { select: { id: true, name: true } },
  author: { select: { id: true, name: true, email: true } },
  viewCount: true,
  helpfulCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

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
    const article = await db.kBArticle.findUnique({
      where: { id },
      select: articleDetailSelect,
    });

    if (!article) {
      return apiError("Not found", { status: 404, message: "Article not found" });
    }

    await db.kBArticle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return apiSuccess({ ...article, viewCount: article.viewCount + 1 });
  } catch (error) {
    console.error("Failed to fetch KB article:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch article" });
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

  const { id } = await params;

  try {
    const existing = await db.kBArticle.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existing) {
      return apiError("Not found", { status: 404, message: "Article not found" });
    }

    const isAuthor = existing.authorId === user.id;
    const isPrivileged = user.role === "ADMIN" || user.role === "MANAGER";

    if (!isAuthor && !isPrivileged) {
      return apiError("Forbidden", { status: 403, message: "You can only edit your own articles" });
    }

    const body = await request.json();
    const validated = updateKBArticleSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const article = await db.kBArticle.update({
      where: { id },
      data: validated.data,
      select: articleDetailSelect,
    });

    return apiSuccess(article);
  } catch (error) {
    console.error("Failed to update KB article:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to update article" });
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

  const { id } = await params;

  try {
    const existing = await db.kBArticle.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existing) {
      return apiError("Not found", { status: 404, message: "Article not found" });
    }

    const isAuthor = existing.authorId === user.id;
    const isPrivileged = user.role === "ADMIN" || user.role === "MANAGER";

    if (!isAuthor && !isPrivileged) {
      return apiError("Forbidden", { status: 403, message: "You can only delete your own articles" });
    }

    await db.kBArticle.delete({ where: { id } });

    return apiSuccess(null, { message: "Article deleted successfully" });
  } catch (error) {
    console.error("Failed to delete KB article:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to delete article" });
  }
}
