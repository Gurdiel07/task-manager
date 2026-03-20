'use client';

import { useMemo, useState } from 'react';
import { Brain, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAcceptPrediction, useAnalyzeTicket } from '@/hooks/use-ai';
import { useTeams } from '@/hooks/use-teams';
import { useUsers } from '@/hooks/use-users';
import type { TicketAnalysis } from '@/types/ai';

interface TicketAIPanelProps {
  ticketId: string;
}

function getConfidenceTone(confidence: number) {
  if (confidence >= 0.8) {
    return 'text-green-600 dark:text-green-400';
  }

  if (confidence >= 0.6) {
    return 'text-yellow-600 dark:text-yellow-400';
  }

  return 'text-red-600 dark:text-red-400';
}

function getConfidencePercent(confidence: number) {
  return Math.round(confidence * 100);
}

function resolveUserLabel(
  userId: string | null,
  users: Array<{ id: string; name: string | null; email: string }>
) {
  if (!userId) {
    return 'Unassigned';
  }

  const user = users.find((candidate) => candidate.id === userId);
  return user ? user.name ?? user.email : userId;
}

function resolveTeamLabel(
  teamId: string | null,
  teams: Array<{ id: string; name: string }>
) {
  if (!teamId) {
    return 'No team';
  }

  const team = teams.find((candidate) => candidate.id === teamId);
  return team ? team.name : teamId;
}

export function TicketAIPanel({ ticketId }: TicketAIPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [hiddenPredictionIds, setHiddenPredictionIds] = useState<string[]>([]);
  const analyzeTicket = useAnalyzeTicket();
  const acceptPrediction = useAcceptPrediction();
  const usersQuery = useUsers();
  const teamsQuery = useTeams();

  const analysis = analyzeTicket.data;

  const visibleAnalysis = useMemo(() => {
    if (!analysis) {
      return null;
    }

    const isVisible = (predictionId: string) =>
      !hiddenPredictionIds.includes(predictionId);

    return {
      priority:
        analysis.priority && isVisible(analysis.priority.predictionId)
          ? analysis.priority
          : null,
      category:
        analysis.category && isVisible(analysis.category.predictionId)
          ? analysis.category
          : null,
      sentiment:
        analysis.sentiment && isVisible(analysis.sentiment.predictionId)
          ? analysis.sentiment
          : null,
      routing:
        analysis.routing && isVisible(analysis.routing.predictionId)
          ? analysis.routing
          : null,
    } satisfies TicketAnalysis;
  }, [analysis, hiddenPredictionIds]);

  function hidePrediction(predictionId: string) {
    setHiddenPredictionIds((current) =>
      current.includes(predictionId)
        ? current
        : [...current, predictionId]
    );
  }

  async function handlePredictionAction(
    predictionId: string,
    accepted: boolean
  ) {
    await acceptPrediction.mutateAsync({
      id: predictionId,
      ticketId,
      accepted,
    });

    hidePrediction(predictionId);
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">AI Insights</CardTitle>
                <p className="text-xs text-muted-foreground">
                  AI-powered triage suggestions for this ticket
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setHiddenPredictionIds([]);
                  analyzeTicket.mutate({ ticketId });
                }}
                disabled={analyzeTicket.isPending}
              >
                {analyzeTicket.isPending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                )}
                Analyze
              </Button>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CollapsibleContent className="space-y-3">
            {analyzeTicket.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`ai-panel-skeleton-${index}`}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : null}

            {!analyzeTicket.isPending && !visibleAnalysis ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm font-medium">No AI analysis yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Run an analysis to get priority, category, sentiment, and routing suggestions.
                </p>
              </div>
            ) : null}

            {visibleAnalysis?.priority ? (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Suggested Priority</p>
                    <p className="text-xs text-muted-foreground">
                      {visibleAnalysis.priority.reasoning}
                    </p>
                  </div>
                  <Badge variant="outline">{visibleAnalysis.priority.priority}</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span
                      className={getConfidenceTone(
                        visibleAnalysis.priority.confidence
                      )}
                    >
                      {getConfidencePercent(visibleAnalysis.priority.confidence)}%
                    </span>
                  </div>
                  <Progress value={getConfidencePercent(visibleAnalysis.priority.confidence)} />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handlePredictionAction(
                        visibleAnalysis.priority!.predictionId,
                        true
                      )
                    }
                    disabled={acceptPrediction.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handlePredictionAction(
                        visibleAnalysis.priority!.predictionId,
                        false
                      )
                    }
                    disabled={acceptPrediction.isPending}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ) : null}

            {visibleAnalysis?.category ? (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Suggested Category</p>
                    <p className="text-xs text-muted-foreground">
                      {visibleAnalysis.category.category} /{' '}
                      {visibleAnalysis.category.subcategory}
                    </p>
                  </div>
                  <Badge variant="secondary">{visibleAnalysis.category.category}</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span
                      className={getConfidenceTone(
                        visibleAnalysis.category.confidence
                      )}
                    >
                      {getConfidencePercent(visibleAnalysis.category.confidence)}%
                    </span>
                  </div>
                  <Progress value={getConfidencePercent(visibleAnalysis.category.confidence)} />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handlePredictionAction(
                        visibleAnalysis.category!.predictionId,
                        true
                      )
                    }
                    disabled={acceptPrediction.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handlePredictionAction(
                        visibleAnalysis.category!.predictionId,
                        false
                      )
                    }
                    disabled={acceptPrediction.isPending}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ) : null}

            {visibleAnalysis?.sentiment ? (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Customer Sentiment</p>
                    <p className="text-xs text-muted-foreground">
                      {visibleAnalysis.sentiment.reasoning ?? 'AI sentiment assessment'}
                    </p>
                  </div>
                  <Badge variant="outline">{visibleAnalysis.sentiment.sentiment}</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span
                      className={getConfidenceTone(
                        visibleAnalysis.sentiment.confidence
                      )}
                    >
                      {getConfidencePercent(visibleAnalysis.sentiment.confidence)}%
                    </span>
                  </div>
                  <Progress
                    value={getConfidencePercent(visibleAnalysis.sentiment.confidence)}
                  />
                </div>
              </div>
            ) : null}

            {visibleAnalysis?.routing ? (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Suggested Routing</p>
                    <p className="text-xs text-muted-foreground">
                      {visibleAnalysis.routing.reasoning}
                    </p>
                  </div>
                  <Badge variant="secondary">Routing</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Assignee:</span>{' '}
                    {resolveUserLabel(
                      visibleAnalysis.routing.suggestedUserId,
                      usersQuery.data ?? []
                    )}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Team:</span>{' '}
                    {resolveTeamLabel(
                      visibleAnalysis.routing.suggestedTeamId,
                      teamsQuery.data ?? []
                    )}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span
                      className={getConfidenceTone(
                        visibleAnalysis.routing.confidence
                      )}
                    >
                      {getConfidencePercent(visibleAnalysis.routing.confidence)}%
                    </span>
                  </div>
                  <Progress value={getConfidencePercent(visibleAnalysis.routing.confidence)} />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handlePredictionAction(
                        visibleAnalysis.routing!.predictionId,
                        true
                      )
                    }
                    disabled={acceptPrediction.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handlePredictionAction(
                        visibleAnalysis.routing!.predictionId,
                        false
                      )
                    }
                    disabled={acceptPrediction.isPending}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ) : null}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
