import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { z } from "zod";

const querySchema = z.object({
  number: z.coerce.number().int().positive("Ticket number must be a positive integer"),
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

    const ticket = await db.ticket.findUnique({
      where: { number: validated.data.number },
      select: {
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!ticket) {
      return apiError("Ticket not found", {
        status: 404,
        message: `No ticket found with number ${validated.data.number}`,
      });
    }

    return apiSuccess(ticket);
  } catch (error) {
    console.error("Failed to fetch ticket status:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch ticket status" });
  }
}
