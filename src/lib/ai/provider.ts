import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { AIProvider } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { aiProviderSettingsSchema } from "@/lib/validators/ai";

const NO_PROVIDER_CONFIGURED_MESSAGE =
  "No AI provider configured. Go to Settings > AI Configuration to set one up.";

type SupportedProvider =
  | ReturnType<typeof createOpenAI>
  | ReturnType<typeof createAnthropic>;

type ProviderConfigInput = {
  provider: (typeof AIProvider)[keyof typeof AIProvider];
  model: string;
  apiKey: string;
  settings: unknown;
};

type GenerateAIPredictionOptions<TPrediction extends Record<string, unknown>> = {
  schema: z.ZodType<TPrediction>;
  prompt: string;
  system: string;
  configId?: string;
};

function getProviderFromConfig(config: ProviderConfigInput): SupportedProvider {
  switch (config.provider) {
    case AIProvider.OPENAI:
      return createOpenAI({
        apiKey: config.apiKey,
      });
    case AIProvider.ANTHROPIC:
      return createAnthropic({
        apiKey: config.apiKey,
      });
    default: {
      const exhaustiveProvider: never = config.provider;
      throw new Error(`Unsupported AI provider: ${String(exhaustiveProvider)}`);
    }
  }
}

function getCallSettings(config: ProviderConfigInput) {
  const parsedSettings = aiProviderSettingsSchema.safeParse(config.settings);

  if (!parsedSettings.success) {
    return {
      temperature: undefined,
      maxOutputTokens: undefined,
    };
  }

  return {
    temperature: parsedSettings.data.temperature,
    maxOutputTokens: parsedSettings.data.maxTokens,
  };
}

async function getPrimaryConfig(configId?: string) {
  if (configId) {
    const config = await db.aIProviderConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new Error("The selected AI provider configuration was not found.");
    }

    return config;
  }

  const defaultConfig = await db.aIProviderConfig.findFirst({
    where: { isDefault: true },
    orderBy: { updatedAt: "desc" },
  });

  if (defaultConfig) {
    return defaultConfig;
  }

  const fallbackConfig = await db.aIProviderConfig.findFirst({
    orderBy: [{ updatedAt: "desc" }],
  });

  if (fallbackConfig) {
    return fallbackConfig;
  }

  throw new Error(NO_PROVIDER_CONFIGURED_MESSAGE);
}

async function getCandidateConfigs(configId?: string) {
  const primaryConfig = await getPrimaryConfig(configId);

  const otherConfigs = configId
    ? await db.aIProviderConfig.findMany({
        where: {
          id: {
            not: primaryConfig.id,
          },
        },
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      })
    : await db.aIProviderConfig.findMany({
        where: {
          id: {
            not: primaryConfig.id,
          },
        },
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      });

  return [primaryConfig, ...otherConfigs];
}

export function maskApiKey(apiKey: string) {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    return "Not configured";
  }

  if (trimmedKey.length <= 8) {
    return `${trimmedKey.slice(0, 2)}...${trimmedKey.slice(-2)}`;
  }

  return `${trimmedKey.slice(0, 4)}...${trimmedKey.slice(-4)}`;
}

export async function getAIProvider(configId?: string): Promise<SupportedProvider> {
  const config = await getPrimaryConfig(configId);
  return getProviderFromConfig(config);
}

export async function validateAIProviderConnection(
  config: ProviderConfigInput
) {
  const provider = getProviderFromConfig(config);
  const model = provider.languageModel(config.model);
  const { maxOutputTokens } = getCallSettings(config);

  await generateObject({
    model,
    schema: z.object({
      ok: z.literal(true),
    }),
    system:
      "You are a connection test helper. Return only the requested structured output.",
    prompt: "Confirm that the provider connection is working.",
    temperature: 0,
    maxOutputTokens: Math.min(maxOutputTokens ?? 32, 64),
  });
}

export async function generateAIPrediction<
  TPrediction extends Record<string, unknown>,
>({
  schema,
  prompt,
  system,
  configId,
}: GenerateAIPredictionOptions<TPrediction>): Promise<TPrediction> {
  const configs = await getCandidateConfigs(configId);
  const errors: string[] = [];

  for (const config of configs) {
    try {
      const provider = getProviderFromConfig(config);
      const model = provider.languageModel(config.model);
      const { object } = await generateObject({
        model,
        schema,
        system,
        prompt,
        ...getCallSettings(config),
      });

      return object;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown AI provider failure";

      errors.push(`${config.provider} (${config.model}): ${message}`);
      console.error("AI prediction failed:", {
        provider: config.provider,
        model: config.model,
        error,
      });
    }
  }

  if (errors.length === 0) {
    throw new Error(NO_PROVIDER_CONFIGURED_MESSAGE);
  }

  throw new Error(
    `AI prediction failed for all configured providers. ${errors.join(" | ")}`
  );
}

export { NO_PROVIDER_CONFIGURED_MESSAGE };
