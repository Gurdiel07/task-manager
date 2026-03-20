import type {
  AIProvider,
  AutomationTrigger,
  PredictionType,
  Priority,
} from "@/generated/prisma/client";

export interface AIProviderConfigItem {
  id: string;
  provider: AIProvider;
  model: string;
  maskedApiKey: string;
  isDefault: boolean;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIPredictionItem {
  id: string;
  ticketId: string;
  predictionType: PredictionType;
  output: Record<string, unknown>;
  confidence: number | null;
  wasAccepted: boolean | null;
  createdAt: string;
}

export interface PredictionResult<
  TPrediction extends Record<string, unknown> = Record<string, unknown>,
> {
  prediction: AIPredictionItem;
  applied: boolean;
  output: TPrediction;
}

export interface PriorityPrediction {
  predictionId: string;
  priority: Priority;
  confidence: number;
  reasoning: string;
}

export interface CategoryPrediction {
  predictionId: string;
  category: string;
  subcategory: string;
  confidence: number;
  reasoning?: string;
}

export interface RoutingPrediction {
  predictionId: string;
  suggestedUserId: string | null;
  suggestedTeamId: string | null;
  reasoning: string;
  confidence: number;
}

export interface SentimentPrediction {
  predictionId: string;
  sentiment: string;
  confidence: number;
  reasoning?: string;
}

export interface SimilarTicketPrediction {
  ticketId: string;
  similarity: number;
  reason: string;
}

export interface SimilarTicketsPrediction {
  predictionId: string;
  matches: SimilarTicketPrediction[];
  confidence: number;
}

export interface TicketAnalysis {
  priority: PriorityPrediction | null;
  category: CategoryPrediction | null;
  sentiment: SentimentPrediction | null;
  routing: RoutingPrediction | null;
}

export interface AutomationRuleCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface AutomationRuleAction {
  type: string;
  params: Record<string, unknown>;
}

export interface AutomationExecutionItem {
  id: string;
  ruleId: string;
  ticketId: string | null;
  status: string;
  result: Record<string, unknown> | null;
  executedAt: string;
}

export interface AutomationRuleItem {
  id: string;
  name: string;
  description: string | null;
  naturalLanguageRule: string;
  compiledRule: {
    conditions: AutomationRuleCondition[];
    actions: AutomationRuleAction[];
  };
  triggerType: AutomationTrigger | string;
  isActive: boolean;
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  _count: {
    executions: number;
  };
}

export interface AutomationRuleDetail extends AutomationRuleItem {
  executions: AutomationExecutionItem[];
}

export interface ParsedRuleResult {
  triggerType: AutomationTrigger | string;
  compiledRule: {
    conditions: AutomationRuleCondition[];
    actions: AutomationRuleAction[];
  };
}
