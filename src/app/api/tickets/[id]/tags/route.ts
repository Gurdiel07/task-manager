import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSessionUser } from "@/lib/ticket-api";
import { ticketTagSchema } from "@/lib/validators/ticket";

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to tag tickets",
    });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = ticketTagSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const ticket = await db.ticket.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!ticket) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket not found",
      });
    }

    const relation = await db.$transaction(async (tx) => {
      let ensuredTag;

      if ('tagId' in validated.data) {
        ensuredTag = await tx.ticketTag.findUnique({
          where: { id: validated.data.tagId },
        });

        if (!ensuredTag) {
          throw new Error('TAG_NOT_FOUND');
        }
      } else {
        ensuredTag =
          (await tx.ticketTag.findFirst({
            where: {
              name: { equals: validated.data.name },
            },
          })) ??
          (await tx.ticketTag.create({
            data: {
              name: validated.data.name,
            },
          }));
      }

      return tx.ticketTagRelation.upsert({
        where: {
          ticketId_tagId: {
            ticketId: id,
            tagId: ensuredTag.id,
          },
        },
        update: {},
        create: {
          ticketId: id,
          tagId: ensuredTag.id,
        },
        include: {
          tag: true,
        },
      });
    });

    return apiSuccess(relation, {
      status: 201,
      message: "Tag added successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'TAG_NOT_FOUND') {
      return apiError('Not found', {
        status: 404,
        message: 'Tag not found',
      });
    }

    console.error("Failed to add tag:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to add tag",
    });
  }
}

export async function DELETE(request: NextRequest, context: TicketRouteContext) {
  const session = await auth();
  const user = getSessionUser(session);

  if (!user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to remove ticket tags",
    });
  }

  try {
    const { id } = await context.params;
    const tagId = request.nextUrl.searchParams.get("tagId");

    if (!tagId) {
      return apiError("Validation failed", {
        status: 400,
        message: "tagId is required",
      });
    }

    const deletedTag = await db.ticketTagRelation.deleteMany({
      where: {
        ticketId: id,
        tagId,
      },
    });

    if (deletedTag.count === 0) {
      return apiError("Not found", {
        status: 404,
        message: "Ticket tag relation not found",
      });
    }

    return apiSuccess(null, {
      message: "Tag removed successfully",
    });
  } catch (error) {
    console.error("Failed to remove tag:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to remove tag",
    });
  }
}
