import {
  automationActionTypeValues,
  automationTriggerValues,
  sentimentValues,
  ticketCategoryValues,
} from "@/lib/validators/ai";
import { priorityValues } from "@/lib/validators/ticket";

type TicketPromptInput = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  subcategory: string | null;
  channel: string;
  teamId: string | null;
  assignedToId: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

type RoutingTeamInput = {
  id: string;
  name: string;
};

type RoutingUserInput = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  skills: unknown;
  workload: number;
  teams: Array<{
    id: string;
    name: string;
  }>;
};

type SimilarTicketCandidateInput = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  subcategory: string | null;
  teamId: string | null;
  assignedToId: string | null;
  createdAt: string;
};

function formatJson(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

export const SYSTEM_PROMPT_BASE = `
You are the AI intelligence layer for TaskFlow, a professional task and ticketing system.
Return structured outputs that strictly match the requested schema.
Do not invent IDs that were not provided in the prompt.
Base your decision on ticket impact, urgency, risk, customer context, and operational workload.
Keep reasoning concise, practical, and suitable for support managers and agents.
`.trim();

export function buildPriorityPrompt(ticket: TicketPromptInput) {
  return `
Determine the most appropriate support ticket priority.

Valid priorities: ${priorityValues.join(", ")}.

Priority guidance:
- CRITICAL: security incidents, data loss, production down, major outage, compliance breach, blocked revenue-critical work.
- HIGH: severe degradation, VIP escalation, major customer impact, urgent blocker with workaround unavailable.
- MEDIUM: normal bugs, operational issues with workaround, moderate customer impact, important internal work.
- LOW: feature requests, documentation updates, minor polish, low-impact questions.

Review the full ticket context and return the best priority, a confidence score between 0 and 1, and a short reasoning summary.

Ticket context:
${formatJson(ticket)}
`.trim();
}

export function buildCategoryPrompt(ticket: TicketPromptInput) {
  return `
Classify the support ticket into a category and subcategory.

Valid categories: ${ticketCategoryValues.join(", ")}.

Subcategory rules:
- Use a short human-readable label.
- Be specific enough to help reporting and triage.
- Examples: "Login Failure", "Billing Inquiry", "API Timeout", "Permission Change".

Return the best category, subcategory, confidence from 0 to 1, and a concise reasoning string.

Ticket context:
${formatJson(ticket)}
`.trim();
}

export function buildRoutingPrompt(
  ticket: TicketPromptInput,
  teams: RoutingTeamInput[],
  users: RoutingUserInput[]
) {
  return `
Suggest the best assignee and/or team for this ticket.

Routing rules:
- Only recommend user IDs and team IDs that appear in the provided context.
- Optimize for topical fit, role suitability, current workload, and team alignment.
- Prefer assigning both a user and a team when confidence is high.
- If the best action is to leave either user or team unassigned, return null for that field.

Return:
- suggestedUserId: string | null
- suggestedTeamId: string | null
- reasoning: brief explanation
- confidence: number between 0 and 1

Ticket:
${formatJson(ticket)}

Available teams:
${formatJson(teams)}

Available users:
${formatJson(users)}
`.trim();
}

export function buildSentimentPrompt(ticket: TicketPromptInput) {
  return `
Analyze the customer sentiment and urgency conveyed in this ticket.

Valid sentiment labels: ${sentimentValues.join(", ")}.

Interpretation guidance:
- Positive: appreciative or clearly satisfied.
- Neutral: factual and calm.
- Frustrated: disappointed or inconvenienced.
- Angry: hostile, accusatory, or highly upset.
- Urgent: explicitly time-sensitive, escalated, or operationally critical in tone.

Return the best sentiment label, confidence from 0 to 1, and a concise reasoning string.

Ticket context:
${formatJson(ticket)}
`.trim();
}

export function buildSimilarTicketsPrompt(
  ticket: TicketPromptInput,
  candidates: SimilarTicketCandidateInput[]
) {
  return `
Identify which candidate tickets are materially similar to the source ticket.

Similarity rules:
- Compare issue type, symptoms, affected system, customer language, and operational context.
- Only return candidate ticket IDs from the provided list.
- Exclude weak matches.
- Similarity must be a number from 0 to 1.

Return:
- matches: array of { ticketId, similarity, reason }
- confidence: overall confidence from 0 to 1

Source ticket:
${formatJson(ticket)}

Candidate tickets:
${formatJson(candidates)}
`.trim();
}

export function buildAutomationRuleParsePrompt(naturalLanguageRule: string) {
  return `
Parse the natural language automation rule into a structured automation rule.

Allowed trigger types:
${formatJson(automationTriggerValues)}

Allowed condition fields:
${formatJson([
  "priority",
  "status",
  "category",
  "subcategory",
  "channel",
  "teamId",
  "assignedToId",
  "ageHours",
  "ageMinutes",
  "hasAssignee",
  "hasTeam",
])}

Allowed operators:
${formatJson([
  "equals",
  "not_equals",
  "contains",
  "in",
  "greater_than",
  "greater_than_or_equal",
  "less_than",
  "less_than_or_equal",
  "is_true",
  "is_false",
])}

Allowed action types:
${formatJson(automationActionTypeValues)}

Action guidance:
- assign_to: params can include userId and/or teamId
- change_status: params must include status
- change_priority: params must include priority
- send_notification: params can include recipient, channel, message
- escalate: params can include target, level, reason
- add_tag: params must include tag

Rules:
- Map natural language to the closest valid trigger type.
- Use only the allowed condition fields, operators, and action types.
- If the rule is missing an explicit trigger, infer the most sensible one.
- Preserve intent without inventing unsupported fields.

Natural language rule:
${naturalLanguageRule}
`.trim();
}

export type {
  RoutingTeamInput,
  RoutingUserInput,
  SimilarTicketCandidateInput,
  TicketPromptInput,
};
