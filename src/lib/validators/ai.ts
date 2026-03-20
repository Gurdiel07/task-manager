import { z } from "zod";
import { priorityValues, ticketStatusValues } from "@/lib/validators/ticket";

export const aiProviderValues = ["OPENAI", "ANTHROPIC"] as const;

export const predictionRequestValues = [
  "priority",
  "category",
  "routing",
  "sentiment",
  "similar",
] as const;

export const ticketCategoryValues = [
  "Bug",
  "Feature Request",
  "Question",
  "Incident",
  "Change Request",
  "Documentation",
  "Performance",
  "Security",
] as const;

export const sentimentValues = [
  "Positive",
  "Neutral",
  "Frustrated",
  "Angry",
  "Urgent",
] as const;

export const automationTriggerValues = [
  "TICKET_CREATED",
  "TICKET_UPDATED",
  "TICKET_STATUS_CHANGED",
  "SLA_WARNING",
  "SLA_BREACH",
  "SCHEDULE",
] as const;

export const automationExecutionStatusValues = [
  "SUCCESS",
  "FAILED",
  "SKIPPED",
] as const;

export const automationActionTypeValues = [
  "assign_to",
  "change_status",
  "change_priority",
  "send_notification",
  "escalate",
  "add_tag",
] as const;

export const aiProviderSettingsSchema = z
  .object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(64000).optional(),
  })
  .catchall(z.unknown());

export const createAIProviderConfigSchema = z.object({
  provider: z.enum(aiProviderValues),
  model: z.string().trim().min(1, "Model is required"),
  apiKey: z.string().trim().min(1, "API key is required"),
  isDefault: z.boolean().optional(),
  settings: aiProviderSettingsSchema.optional(),
  test: z.boolean().optional(),
});

export const updateAIProviderConfigSchema = z
  .object({
    provider: z.enum(aiProviderValues).optional(),
    model: z.string().trim().min(1, "Model is required").optional(),
    apiKey: z.string().trim().min(1, "API key is required").optional(),
    isDefault: z.boolean().optional(),
    settings: aiProviderSettingsSchema.optional(),
    test: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const predictionRequestSchema = z.object({
  type: z.enum(predictionRequestValues),
  ticketId: z.string().trim().min(1, "Ticket ID is required"),
});

export const predictionAcceptanceSchema = z.object({
  accepted: z.boolean(),
});

export const analyzeTicketSchema = z.object({
  ticketId: z.string().trim().min(1, "Ticket ID is required"),
});

export const automationConditionSchema = z.object({
  field: z.string().trim().min(1, "Field is required"),
  operator: z.string().trim().min(1, "Operator is required"),
  value: z.unknown(),
});

export const automationActionSchema = z.object({
  type: z.enum(automationActionTypeValues),
  params: z.record(z.string(), z.unknown()).default({}),
});

export const compiledAutomationRuleSchema = z.object({
  conditions: z.array(automationConditionSchema).default([]),
  actions: z.array(automationActionSchema).default([]),
});

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer")
  .optional()
  .transform((value) => (value ? value : undefined));

export const automationRuleCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  description: optionalDescriptionSchema,
  naturalLanguageRule: z
    .string()
    .trim()
    .min(1, "Natural language rule is required"),
});

export const automationRuleUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255).optional(),
    description: optionalDescriptionSchema,
    naturalLanguageRule: z
      .string()
      .trim()
      .min(1, "Natural language rule is required")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const automationRuleParseSchema = z.object({
  naturalLanguageRule: z
    .string()
    .trim()
    .min(1, "Natural language rule is required"),
});

export const priorityPredictionOutputSchema = z.object({
  priority: z.enum(priorityValues),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().trim().min(1, "Reasoning is required"),
});

export const categoryPredictionOutputSchema = z.object({
  category: z.enum(ticketCategoryValues),
  subcategory: z.string().trim().min(1, "Subcategory is required"),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().trim().min(1, "Reasoning is required").optional(),
});

export const routingPredictionOutputSchema = z.object({
  suggestedUserId: z.string().trim().min(1).nullable().optional(),
  suggestedTeamId: z.string().trim().min(1).nullable().optional(),
  reasoning: z.string().trim().min(1, "Reasoning is required"),
  confidence: z.number().min(0).max(1),
});

export const sentimentPredictionOutputSchema = z.object({
  sentiment: z.enum(sentimentValues),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().trim().min(1, "Reasoning is required").optional(),
});

export const similarTicketItemSchema = z.object({
  ticketId: z.string().trim().min(1, "Ticket ID is required"),
  similarity: z.number().min(0).max(1),
  reason: z.string().trim().min(1, "Reason is required"),
});

export const similarTicketsPredictionOutputSchema = z.object({
  matches: z.array(similarTicketItemSchema).default([]),
  confidence: z.number().min(0).max(1),
});

export const parsedAutomationRuleSchema = z.object({
  triggerType: z.enum(automationTriggerValues),
  compiledRule: compiledAutomationRuleSchema,
});

export const ticketStatusConditionValueSchema = z.enum(ticketStatusValues);

export type AIProviderSettingsInput = z.infer<typeof aiProviderSettingsSchema>;
export type CreateAIProviderConfigInput = z.infer<
  typeof createAIProviderConfigSchema
>;
export type UpdateAIProviderConfigInput = z.infer<
  typeof updateAIProviderConfigSchema
>;
export type PredictionRequestInput = z.infer<typeof predictionRequestSchema>;
export type PredictionAcceptanceInput = z.infer<
  typeof predictionAcceptanceSchema
>;
export type AnalyzeTicketInput = z.infer<typeof analyzeTicketSchema>;
export type AutomationRuleCreateInput = z.infer<
  typeof automationRuleCreateSchema
>;
export type AutomationRuleUpdateInput = z.infer<
  typeof automationRuleUpdateSchema
>;
export type AutomationRuleParseInput = z.infer<
  typeof automationRuleParseSchema
>;
export type PriorityPredictionOutput = z.infer<
  typeof priorityPredictionOutputSchema
>;
export type CategoryPredictionOutput = z.infer<
  typeof categoryPredictionOutputSchema
>;
export type RoutingPredictionOutput = z.infer<
  typeof routingPredictionOutputSchema
>;
export type SentimentPredictionOutput = z.infer<
  typeof sentimentPredictionOutputSchema
>;
export type SimilarTicketsPredictionOutput = z.infer<
  typeof similarTicketsPredictionOutputSchema
>;
export type ParsedAutomationRuleOutput = z.infer<
  typeof parsedAutomationRuleSchema
>;
