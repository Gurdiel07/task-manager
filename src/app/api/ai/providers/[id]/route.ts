import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { serializeAIProviderConfig } from "@/lib/ai/serializers";
import { validateAIProviderConnection } from "@/lib/ai/provider";
import { updateAIProviderConfigSchema } from "@/lib/validators/ai";

type ProviderRouteContext = {
  params: Promise<{ id: string }>;
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function GET(_request: Request, context: ProviderRouteContext) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view AI providers",
    });
  }

  try {
    const { id } = await context.params;
    const config = await db.aIProviderConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return apiError("Not found", {
        status: 404,
        message: "AI provider config not found",
      });
    }

    return apiSuccess(serializeAIProviderConfig(config));
  } catch (error) {
    console.error("Failed to fetch AI provider config:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch AI provider config",
    });
  }
}

export async function PUT(request: Request, context: ProviderRouteContext) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to update AI providers",
    });
  }

  if (session.user.role !== "ADMIN") {
    return apiError("Forbidden", {
      status: 403,
      message: "Only administrators can manage AI providers",
    });
  }

  try {
    const { id } = await context.params;
    const existingConfig = await db.aIProviderConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return apiError("Not found", {
        status: 404,
        message: "AI provider config not found",
      });
    }

    const body = await request.json();
    const validated = updateAIProviderConfigSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const payload = validated.data;
    const mergedConfig = {
      provider: payload.provider ?? existingConfig.provider,
      model: payload.model ?? existingConfig.model,
      apiKey: payload.apiKey ?? existingConfig.apiKey,
      settings:
        payload.settings !== undefined ? payload.settings : existingConfig.settings,
    };

    if (payload.test) {
      await validateAIProviderConnection({
        provider: mergedConfig.provider,
        model: mergedConfig.model,
        apiKey: mergedConfig.apiKey,
        settings: mergedConfig.settings,
      });
    }

    const config = await db.$transaction(async (tx) => {
      if (payload.isDefault) {
        await tx.aIProviderConfig.updateMany({
          data: { isDefault: false },
          where: {
            id: {
              not: id,
            },
          },
        });
      }

      return tx.aIProviderConfig.update({
        where: { id },
        data: {
          provider: payload.provider,
          model: payload.model,
          apiKey: payload.apiKey,
          isDefault: payload.isDefault,
          settings:
            payload.settings !== undefined
              ? toJsonValue(payload.settings)
              : undefined,
        },
      });
    });

    return apiSuccess(serializeAIProviderConfig(config), {
      message: payload.test
        ? "AI provider verified and updated successfully"
        : "AI provider updated successfully",
    });
  } catch (error) {
    console.error("Failed to update AI provider config:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update AI provider config",
    });
  }
}

export async function DELETE(_request: Request, context: ProviderRouteContext) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to delete AI providers",
    });
  }

  if (session.user.role !== "ADMIN") {
    return apiError("Forbidden", {
      status: 403,
      message: "Only administrators can manage AI providers",
    });
  }

  try {
    const { id } = await context.params;
    const [config, totalConfigs] = await Promise.all([
      db.aIProviderConfig.findUnique({
        where: { id },
      }),
      db.aIProviderConfig.count(),
    ]);

    if (!config) {
      return apiError("Not found", {
        status: 404,
        message: "AI provider config not found",
      });
    }

    if (totalConfigs <= 1) {
      return apiError("Validation failed", {
        status: 400,
        message: "You cannot delete the last AI provider configuration",
      });
    }

    await db.$transaction(async (tx) => {
      await tx.aIProviderConfig.delete({
        where: { id },
      });

      if (config.isDefault) {
        const replacement = await tx.aIProviderConfig.findFirst({
          orderBy: [{ updatedAt: "desc" }],
        });

        if (replacement) {
          await tx.aIProviderConfig.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return apiSuccess(null, {
      message: "AI provider deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete AI provider config:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to delete AI provider config",
    });
  }
}
