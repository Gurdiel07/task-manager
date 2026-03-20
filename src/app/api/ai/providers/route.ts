import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { serializeAIProviderConfig } from "@/lib/ai/serializers";
import { validateAIProviderConnection } from "@/lib/ai/provider";
import { createAIProviderConfigSchema } from "@/lib/validators/ai";
import { Prisma } from "@/generated/prisma/client";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view AI providers",
    });
  }

  try {
    const configs = await db.aIProviderConfig.findMany({
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });

    return apiSuccess(configs.map(serializeAIProviderConfig));
  } catch (error) {
    console.error("Failed to fetch AI provider configs:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch AI provider configs",
    });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to create AI providers",
    });
  }

  if (session.user.role !== "ADMIN") {
    return apiError("Forbidden", {
      status: 403,
      message: "Only administrators can manage AI providers",
    });
  }

  try {
    const body = await request.json();
    const validated = createAIProviderConfigSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const payload = validated.data;

    if (payload.test) {
      await validateAIProviderConnection({
        provider: payload.provider,
        model: payload.model,
        apiKey: payload.apiKey,
        settings: payload.settings ?? null,
      });
    }

    const existingCount = await db.aIProviderConfig.count();
    const shouldBeDefault = payload.isDefault ?? existingCount === 0;

    const config = await db.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.aIProviderConfig.updateMany({
          data: { isDefault: false },
          where: { isDefault: true },
        });
      }

      return tx.aIProviderConfig.create({
        data: {
          provider: payload.provider,
          model: payload.model,
          apiKey: payload.apiKey,
          isDefault: shouldBeDefault,
          settings: payload.settings ? toJsonValue(payload.settings) : undefined,
        },
      });
    });

    return apiSuccess(serializeAIProviderConfig(config), {
      status: 201,
      message: payload.test
        ? "AI provider verified and saved successfully"
        : "AI provider saved successfully",
    });
  } catch (error) {
    console.error("Failed to create AI provider config:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create AI provider config",
    });
  }
}
