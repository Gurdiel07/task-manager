import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  findSimilarTickets,
  predictCategory,
  predictPriority,
  predictRouting,
  predictSentiment,
} from "@/lib/ai/services";
import { predictionRequestSchema } from "@/lib/validators/ai";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to run AI predictions",
    });
  }

  try {
    const body = await request.json();
    const validated = predictionRequestSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const { type, ticketId } = validated.data;

    switch (type) {
      case "priority":
        return apiSuccess(await predictPriority(ticketId));
      case "category":
        return apiSuccess(await predictCategory(ticketId));
      case "routing":
        return apiSuccess(await predictRouting(ticketId));
      case "sentiment":
        return apiSuccess(await predictSentiment(ticketId));
      case "similar":
        return apiSuccess(await findSimilarTickets(ticketId));
      default:
        return apiError("Validation failed", {
          status: 400,
          message: "Unsupported prediction type",
        });
    }
  } catch (error) {
    console.error("Failed to run AI prediction:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to run AI prediction",
    });
  }
}
