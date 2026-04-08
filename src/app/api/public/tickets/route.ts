import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import type { Priority } from "@/generated/prisma/client";

const publicTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = publicTicketSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { title, description, email, priority: priorityValue } = validated.data;
    const priority = priorityValue as Priority;

    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: email.split("@")[0],
        role: "CUSTOMER",
      },
    });

    const last = await db.ticket.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    const nextNumber = (last?.number ?? 0) + 1;

    const ticket = await db.ticket.create({
      data: {
        number: nextNumber,
        title,
        description,
        priority,
        status: "OPEN",
        channel: "WEB",
        createdById: user.id,
      },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    return apiSuccess(ticket, {
      status: 201,
      message: "Your request has been submitted successfully",
    });
  } catch (error) {
    console.error("Failed to create public ticket:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to submit your request",
    });
  }
}
