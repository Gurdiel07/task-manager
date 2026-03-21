import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

type BadgeRouteContext = {
  params: Promise<{ id: string }>;
};

const updateBadgeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
  criteria: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  _request: Request,
  context: BadgeRouteContext
) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await context.params;

    const badge = await db.badge.findUnique({
      where: { id },
      include: {
        userBadges: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { awardedAt: "desc" },
        },
      },
    });

    if (!badge) {
      return apiError("Not found", { status: 404, message: "Badge not found" });
    }

    return apiSuccess(badge);
  } catch (error) {
    console.error("Failed to fetch badge:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch badge" });
  }
}

export async function PUT(
  request: Request,
  context: BadgeRouteContext
) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return apiError("Forbidden", { status: 403, message: "Only admins can update badges" });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateBadgeSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const existing = await db.badge.findUnique({ where: { id } });
    if (!existing) {
      return apiError("Not found", { status: 404, message: "Badge not found" });
    }

    const badge = await db.badge.update({
      where: { id },
      data: {
        ...validated.data,
        criteria: validated.data.criteria
          ? (validated.data.criteria as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return apiSuccess(badge);
  } catch (error) {
    console.error("Failed to update badge:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to update badge" });
  }
}

export async function DELETE(
  _request: Request,
  context: BadgeRouteContext
) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return apiError("Forbidden", { status: 403, message: "Only admins can delete badges" });
  }

  try {
    const { id } = await context.params;

    const existing = await db.badge.findUnique({ where: { id } });
    if (!existing) {
      return apiError("Not found", { status: 404, message: "Badge not found" });
    }

    await db.userBadge.deleteMany({ where: { badgeId: id } });
    await db.badge.delete({ where: { id } });

    return apiSuccess(null, { message: "Badge deleted successfully" });
  } catch (error) {
    console.error("Failed to delete badge:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to delete badge" });
  }
}
