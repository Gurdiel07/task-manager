import { Prisma } from "@/generated/prisma/client";
import { PredictionType, TicketStatus, UserRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  buildAutomationRuleParsePrompt,
  buildCategoryPrompt,
  buildPriorityPrompt,
  buildRoutingPrompt,
  buildSentimentPrompt,
  buildSimilarTicketsPrompt,
  SYSTEM_PROMPT_BASE,
  type RoutingTeamInput,
  type RoutingUserInput,
  type SimilarTicketCandidateInput,
  type TicketPromptInput,
} from "@/lib/ai/prompts";
import { generateAIPrediction } from "@/lib/ai/provider";
import {
  categoryPredictionOutputSchema,
  parsedAutomationRuleSchema,
  priorityPredictionOutputSchema,
  routingPredictionOutputSchema,
  sentimentPredictionOutputSchema,
  similarTicketsPredictionOutputSchema,
  type CategoryPredictionOutput,
  type ParsedAutomationRuleOutput,
  type PriorityPredictionOutput,
  type RoutingPredictionOutput,
  type SentimentPredictionOutput,
  type SimilarTicketsPredictionOutput,
} from "@/lib/validators/ai";
import type {
  CategoryPrediction,
  PredictionResult,
  PriorityPrediction,
  RoutingPrediction,
  SentimentPrediction,
  SimilarTicketsPrediction,
  TicketAnalysis,
} from "@/types/ai";

const aiTicketSelect = {
  id: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  category: true,
  subcategory: true,
  channel: true,
  teamId: true,
  assignedToId: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TicketSelect;

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toOutputRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toTicketPromptInput(ticket: Prisma.TicketGetPayload<{ select: typeof aiTicketSelect }>): TicketPromptInput {
  return {
    id: ticket.id,
    number: ticket.number,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    subcategory: ticket.subcategory,
    channel: ticket.channel,
    teamId: ticket.teamId,
    assignedToId: ticket.assignedToId,
    metadata: ticket.metadata,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

async function getTicketForAI(ticketId: string) {
  const ticket = await db.ticket.findFirst({
    where: {
      id: ticketId,
      deletedAt: null,
    },
    select: aiTicketSelect,
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  return ticket;
}

async function logPrediction<TOutput extends Record<string, unknown>>({
  ticketId,
  predictionType,
  input,
  output,
  confidence,
}: {
  ticketId: string;
  predictionType: keyof typeof PredictionType;
  input: Record<string, unknown>;
  output: TOutput;
  confidence?: number;
}) {
  return db.aIPredictionLog.create({
    data: {
      ticketId,
      predictionType: PredictionType[predictionType],
      input: toJsonValue(input),
      output: toJsonValue(output),
      confidence,
    },
  });
}

function buildPredictionResult<TOutput extends Record<string, unknown>>(
  prediction: {
    id: string;
    ticketId: string;
    predictionType: string;
    output: Prisma.JsonValue;
    confidence: number | null;
    wasAccepted: boolean | null;
    createdAt: Date;
  },
  applied: boolean,
  output: TOutput
): PredictionResult<TOutput> {
  return {
    prediction: {
      id: prediction.id,
      ticketId: prediction.ticketId,
      predictionType: prediction.predictionType as PredictionResult["prediction"]["predictionType"],
      output: toOutputRecord(prediction.output),
      confidence: prediction.confidence,
      wasAccepted: prediction.wasAccepted,
      createdAt: prediction.createdAt.toISOString(),
    },
    applied,
    output,
  };
}

function toPriorityAnalysisItem(result: PredictionResult<PriorityPredictionOutput>): PriorityPrediction {
  return {
    predictionId: result.prediction.id,
    priority: result.output.priority,
    confidence: result.output.confidence,
    reasoning: result.output.reasoning,
  };
}

function toCategoryAnalysisItem(
  result: PredictionResult<CategoryPredictionOutput>
): CategoryPrediction {
  return {
    predictionId: result.prediction.id,
    category: result.output.category,
    subcategory: result.output.subcategory,
    confidence: result.output.confidence,
    reasoning: result.output.reasoning,
  };
}

function toSentimentAnalysisItem(
  result: PredictionResult<SentimentPredictionOutput>
): SentimentPrediction {
  return {
    predictionId: result.prediction.id,
    sentiment: result.output.sentiment,
    confidence: result.output.confidence,
    reasoning: result.output.reasoning,
  };
}

function toRoutingAnalysisItem(
  result: PredictionResult<RoutingPredictionOutput>
): RoutingPrediction {
  return {
    predictionId: result.prediction.id,
    suggestedUserId: result.output.suggestedUserId ?? null,
    suggestedTeamId: result.output.suggestedTeamId ?? null,
    reasoning: result.output.reasoning,
    confidence: result.output.confidence,
  };
}

async function getRoutingContext() {
  const [teams, users, activeAssignments] = await Promise.all([
    db.team.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        role: {
          in: [UserRole.AGENT, UserRole.MANAGER, UserRole.ADMIN],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        teamMembers: {
          select: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
    db.ticket.findMany({
      where: {
        deletedAt: null,
        assignedToId: {
          not: null,
        },
        status: {
          in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING],
        },
      },
      select: {
        assignedToId: true,
      },
    }),
  ]);

  const workloadMap = activeAssignments.reduce<Record<string, number>>(
    (accumulator, assignment) => {
      if (!assignment.assignedToId) {
        return accumulator;
      }

      accumulator[assignment.assignedToId] =
        (accumulator[assignment.assignedToId] ?? 0) + 1;

      return accumulator;
    },
    {}
  );

  const routingTeams: RoutingTeamInput[] = teams.map((team) => ({
    id: team.id,
    name: team.name,
  }));

  const routingUsers: RoutingUserInput[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    skills: user.skills,
    workload: workloadMap[user.id] ?? 0,
    teams: user.teamMembers.map((membership) => ({
      id: membership.team.id,
      name: membership.team.name,
    })),
  }));

  return {
    teams: routingTeams,
    users: routingUsers,
  };
}

export async function predictPriority(ticketId: string) {
  const ticket = await getTicketForAI(ticketId);
  const promptTicket = toTicketPromptInput(ticket);
  const output = await generateAIPrediction({
    schema: priorityPredictionOutputSchema,
    system: SYSTEM_PROMPT_BASE,
    prompt: buildPriorityPrompt(promptTicket),
  });

  const prediction = await logPrediction({
    ticketId,
    predictionType: "PRIORITY",
    input: {
      ticket: promptTicket,
    },
    output,
    confidence: output.confidence,
  });

  return buildPredictionResult(prediction, false, output);
}

export async function predictCategory(ticketId: string) {
  const ticket = await getTicketForAI(ticketId);
  const promptTicket = toTicketPromptInput(ticket);
  const output = await generateAIPrediction({
    schema: categoryPredictionOutputSchema,
    system: SYSTEM_PROMPT_BASE,
    prompt: buildCategoryPrompt(promptTicket),
  });

  const prediction = await logPrediction({
    ticketId,
    predictionType: "CATEGORY",
    input: {
      ticket: promptTicket,
    },
    output,
    confidence: output.confidence,
  });

  return buildPredictionResult(prediction, false, output);
}

export async function predictRouting(ticketId: string) {
  const [ticket, routingContext] = await Promise.all([
    getTicketForAI(ticketId),
    getRoutingContext(),
  ]);

  const promptTicket = toTicketPromptInput(ticket);
  const output = await generateAIPrediction({
    schema: routingPredictionOutputSchema,
    system: SYSTEM_PROMPT_BASE,
    prompt: buildRoutingPrompt(
      promptTicket,
      routingContext.teams,
      routingContext.users
    ),
  });

  const prediction = await logPrediction({
    ticketId,
    predictionType: "ROUTING",
    input: {
      ticket: promptTicket,
      teams: routingContext.teams,
      users: routingContext.users,
    },
    output,
    confidence: output.confidence,
  });

  return buildPredictionResult(prediction, false, output);
}

export async function predictSentiment(ticketId: string) {
  const ticket = await getTicketForAI(ticketId);
  const promptTicket = toTicketPromptInput(ticket);
  const output = await generateAIPrediction({
    schema: sentimentPredictionOutputSchema,
    system: SYSTEM_PROMPT_BASE,
    prompt: buildSentimentPrompt(promptTicket),
  });

  const prediction = await logPrediction({
    ticketId,
    predictionType: "SENTIMENT",
    input: {
      ticket: promptTicket,
    },
    output,
    confidence: output.confidence,
  });

  return buildPredictionResult(prediction, false, output);
}

export async function findSimilarTickets(ticketId: string) {
  const [ticket, candidates] = await Promise.all([
    getTicketForAI(ticketId),
    db.ticket.findMany({
      where: {
        deletedAt: null,
        id: {
          not: ticketId,
        },
      },
      select: {
        id: true,
        number: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        category: true,
        subcategory: true,
        teamId: true,
        assignedToId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 25,
    }),
  ]);

  const promptTicket = toTicketPromptInput(ticket);
  const candidateInputs: SimilarTicketCandidateInput[] = candidates.map(
    (candidate) => ({
      id: candidate.id,
      number: candidate.number,
      title: candidate.title,
      description: candidate.description,
      status: candidate.status,
      priority: candidate.priority,
      category: candidate.category,
      subcategory: candidate.subcategory,
      teamId: candidate.teamId,
      assignedToId: candidate.assignedToId,
      createdAt: candidate.createdAt.toISOString(),
    })
  );

  const output = await generateAIPrediction({
    schema: similarTicketsPredictionOutputSchema,
    system: SYSTEM_PROMPT_BASE,
    prompt: buildSimilarTicketsPrompt(promptTicket, candidateInputs),
  });

  const validCandidateIds = new Set(candidateInputs.map((candidate) => candidate.id));
  const filteredOutput: SimilarTicketsPredictionOutput = {
    confidence: output.confidence,
    matches: output.matches
      .filter((match) => validCandidateIds.has(match.ticketId))
      .sort((a, b) => b.similarity - a.similarity),
  };

  const prediction = await logPrediction({
    ticketId,
    predictionType: "CLUSTER",
    input: {
      ticket: promptTicket,
      candidates: candidateInputs,
    },
    output: filteredOutput,
    confidence: filteredOutput.confidence,
  });

  return buildPredictionResult(prediction, false, filteredOutput);
}

export async function analyzeTicket(ticketId: string): Promise<TicketAnalysis> {
  const [priorityResult, categoryResult, sentimentResult, routingResult] =
    await Promise.allSettled([
      predictPriority(ticketId),
      predictCategory(ticketId),
      predictSentiment(ticketId),
      predictRouting(ticketId),
    ]);

  if (priorityResult.status === "rejected") {
    console.error("Priority analysis failed:", priorityResult.reason);
  }

  if (categoryResult.status === "rejected") {
    console.error("Category analysis failed:", categoryResult.reason);
  }

  if (sentimentResult.status === "rejected") {
    console.error("Sentiment analysis failed:", sentimentResult.reason);
  }

  if (routingResult.status === "rejected") {
    console.error("Routing analysis failed:", routingResult.reason);
  }

  return {
    priority:
      priorityResult.status === "fulfilled"
        ? toPriorityAnalysisItem(priorityResult.value)
        : null,
    category:
      categoryResult.status === "fulfilled"
        ? toCategoryAnalysisItem(categoryResult.value)
        : null,
    sentiment:
      sentimentResult.status === "fulfilled"
        ? toSentimentAnalysisItem(sentimentResult.value)
        : null,
    routing:
      routingResult.status === "fulfilled"
        ? toRoutingAnalysisItem(routingResult.value)
        : null,
  };
}

export async function parseAutomationRule(
  naturalLanguageRule: string
): Promise<ParsedAutomationRuleOutput> {
  return generateAIPrediction({
    schema: parsedAutomationRuleSchema,
    system: SYSTEM_PROMPT_BASE,
    prompt: buildAutomationRuleParsePrompt(naturalLanguageRule),
  });
}

export type { CategoryPredictionOutput, PriorityPredictionOutput, RoutingPredictionOutput, SentimentPredictionOutput, SimilarTicketsPredictionOutput };
export type SimilarTicketsPredictionResult = PredictionResult<SimilarTicketsPredictionOutput>;
export type PriorityPredictionResult = PredictionResult<PriorityPredictionOutput>;
export type CategoryPredictionResult = PredictionResult<CategoryPredictionOutput>;
export type RoutingPredictionResult = PredictionResult<RoutingPredictionOutput>;
export type SentimentPredictionResult = PredictionResult<SentimentPredictionOutput>;
export type SimilarClusterPrediction = SimilarTicketsPrediction;
