import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await db.kBArticle.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return apiError("Not found", { status: 404, message: "Article not found" });
    }

    const article = await db.kBArticle.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
      select: { id: true, helpfulCount: true },
    });

    return apiSuccess(article);
  } catch (error) {
    console.error("Failed to mark article as helpful:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to mark as helpful" });
  }
}
