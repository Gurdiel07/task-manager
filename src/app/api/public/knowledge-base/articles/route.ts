import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = querySchema.safeParse(raw);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { search, page, limit } = validated.data;
    const skip = (page - 1) * limit;

    const where = {
      status: "PUBLISHED" as const,
      ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [articles, total] = await db.$transaction([
      db.kBArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
          viewCount: true,
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
    console.error("Failed to fetch public KB articles:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch articles" });
  }
}
