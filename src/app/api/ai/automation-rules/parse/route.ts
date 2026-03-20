import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { parseAutomationRule } from "@/lib/ai/services";
import { automationRuleParseSchema } from "@/lib/validators/ai";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to parse automation rules",
    });
  }

  try {
    const body = await request.json();
    const validated = automationRuleParseSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const parsed = await parseAutomationRule(validated.data.naturalLanguageRule);
    return apiSuccess(parsed);
  } catch (error) {
    console.error("Failed to parse automation rule:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to parse the automation rule",
    });
  }
}
