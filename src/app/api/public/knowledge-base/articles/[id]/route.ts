import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";

type ArticleRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ArticleRouteContext) {
  try {
    const { id } = await context.params;

    const article = await db.kBArticle.findFirst({
      where: { id, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        content: true,
        viewCount: true,
        helpfulCount: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true } },
        author: { select: { name: true } },
      },
    });

    if (!article) {
      return apiError("Not found", {
        status: 404,
        message: "Article not found",
      });
    }

    await db.kBArticle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return apiSuccess(article);
  } catch (error) {
    console.error("Failed to fetch article:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch article",
    });
  }
}
