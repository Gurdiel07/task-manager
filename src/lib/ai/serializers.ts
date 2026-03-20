import type { Prisma } from "@/generated/prisma/client";
import { maskApiKey } from "@/lib/ai/provider";
import type {
  AIProviderConfigItem,
  AIPredictionItem,
  AutomationExecutionItem,
  AutomationRuleDetail,
  AutomationRuleItem,
} from "@/types/ai";

function toRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (value === null) {
    return null;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toCompiledRule(value: Prisma.JsonValue) {
  const record = toRecord(value);
  const rawConditions = record?.conditions;
  const rawActions = record?.actions;

  return {
    conditions: Array.isArray(rawConditions)
      ? rawConditions.filter(
          (
            condition
          ): condition is { field: string; operator: string; value: unknown } =>
            Boolean(
              condition &&
                typeof condition === "object" &&
                "field" in condition &&
                "operator" in condition
            )
        )
      : [],
    actions: Array.isArray(rawActions)
      ? rawActions.filter(
          (
            action
          ): action is { type: string; params: Record<string, unknown> } =>
            Boolean(
              action &&
                typeof action === "object" &&
                "type" in action &&
                "params" in action
            )
        )
      : [],
  };
}

export function serializeAIProviderConfig(config: {
  id: string;
  provider: "OPENAI" | "ANTHROPIC";
  model: string;
  apiKey: string;
  isDefault: boolean;
  settings: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): AIProviderConfigItem {
  return {
    id: config.id,
    provider: config.provider,
    model: config.model,
    maskedApiKey: maskApiKey(config.apiKey),
    isDefault: config.isDefault,
    settings: toRecord(config.settings),
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export function serializeAIPredictionLog(log: {
  id: string;
  ticketId: string;
  predictionType: "PRIORITY" | "CATEGORY" | "ROUTING" | "CLUSTER" | "SENTIMENT";
  output: Prisma.JsonValue;
  confidence: number | null;
  wasAccepted: boolean | null;
  createdAt: Date;
}): AIPredictionItem {
  return {
    id: log.id,
    ticketId: log.ticketId,
    predictionType: log.predictionType,
    output: toRecord(log.output) ?? {},
    confidence: log.confidence,
    wasAccepted: log.wasAccepted,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeAutomationExecution(execution: {
  id: string;
  ruleId: string;
  ticketId: string | null;
  status: string;
  result: Prisma.JsonValue | null;
  executedAt: Date;
}): AutomationExecutionItem {
  return {
    id: execution.id,
    ruleId: execution.ruleId,
    ticketId: execution.ticketId,
    status: execution.status,
    result: toRecord(execution.result),
    executedAt: execution.executedAt.toISOString(),
  };
}

export function serializeAutomationRuleItem(rule: {
  id: string;
  name: string;
  description: string | null;
  naturalLanguageRule: string;
  compiledRule: Prisma.JsonValue;
  triggerType: string;
  isActive: boolean;
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  _count: {
    executions: number;
  };
}): AutomationRuleItem {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    naturalLanguageRule: rule.naturalLanguageRule,
    compiledRule: toCompiledRule(rule.compiledRule),
    triggerType: rule.triggerType,
    isActive: rule.isActive,
    createdById: rule.createdById,
    createdBy: {
      id: rule.createdBy.id,
      name: rule.createdBy.name,
      email: rule.createdBy.email,
    },
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    _count: rule._count,
  };
}

export function serializeAutomationRuleDetail(rule: {
  id: string;
  name: string;
  description: string | null;
  naturalLanguageRule: string;
  compiledRule: Prisma.JsonValue;
  triggerType: string;
  isActive: boolean;
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  _count: {
    executions: number;
  };
  executions: Array<{
    id: string;
    ruleId: string;
    ticketId: string | null;
    status: string;
    result: Prisma.JsonValue | null;
    executedAt: Date;
  }>;
}): AutomationRuleDetail {
  return {
    ...serializeAutomationRuleItem(rule),
    executions: rule.executions.map(serializeAutomationExecution),
  };
}
