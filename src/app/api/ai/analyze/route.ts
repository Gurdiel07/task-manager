import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { analyzeTicket } from "@/lib/ai/services";
import { analyzeTicketSchema } from "@/lib/validators/ai";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to analyze tickets",
    });
  }

  try {
    const body = await request.json();
    const validated = analyzeTicketSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const analysis = await analyzeTicket(validated.data.ticketId);
    return apiSuccess(analysis);
  } catch (error) {
    console.error("Failed to analyze ticket:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to analyze the ticket",
    });
  }
}
