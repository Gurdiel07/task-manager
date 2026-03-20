'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  ChevronRight,
  History,
  Link2,
  MessageSquare,
  Paperclip,
  Search,
  Trash2,
} from 'lucide-react';
import type { UserRole } from '@/generated/prisma/client';
import { TicketAIPanel } from '@/components/tickets/ticket-ai-panel';
import { TicketComments } from '@/components/tickets/ticket-comments';
import { TicketSidebar } from '@/components/tickets/ticket-sidebar';
import { EmptyState } from '@/components/shared/empty-state';
import { PriorityBadge } from '@/components/shared/priority-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  relationTypeLabels,
  relationTypeOptions,
  ticketStatusLabels,
} from '@/lib/ticket-options';
import {
  useAddRelation,
  useAddTag,
  useCreateComment,
  useTicket,
  useTicketComments,
  useTicketHistory,
  useTicketRelations,
  useTicketWatchers,
  useTickets,
  useToggleWatcher,
  useUpdateTicket,
  useRemoveRelation,
  useRemoveTag,
} from '@/hooks/use-tickets';
import { useTeams } from '@/hooks/use-teams';
import { useUsers } from '@/hooks/use-users';

function renderDescription(description: string) {
  return description.split('\n').map((line, index) => {
    if (line.startsWith('## ')) {
      return (
        <h2
          key={`${line}-${index}`}
          className="mb-2 mt-4 text-base font-semibold first:mt-0"
        >
          {line.replace('## ', '')}
        </h2>
      );
    }

    if (line.startsWith('- ')) {
      return (
        <li key={`${line}-${index}`} className="ml-4 text-sm">
          {line.replace('- ', '')}
        </li>
      );
    }

    if (line.trim() === '') {
      return <br key={`break-${index}`} />;
    }

    return (
      <p key={`${line}-${index}`} className="text-sm">
        {line}
      </p>
    );
  });
}

function renderHistoryEntry(entry: {
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  user: { name: string | null; email: string };
}) {
  const actor = entry.user.name ?? entry.user.email;

  if (entry.action === 'CREATED') {
    return `${actor} created this ticket`;
  }

  if (entry.action === 'COMMENTED') {
    return `${actor} added a comment`;
  }

  if (entry.field) {
    const fieldLabel =
      entry.field === 'assignedToId'
        ? 'assignee'
        : entry.field === 'teamId'
          ? 'team'
          : entry.field === 'dueDate'
            ? 'due date'
            : entry.field;

    return `${actor} updated ${fieldLabel} from ${
      entry.oldValue ?? 'empty'
    } to ${entry.newValue ?? 'empty'}`;
  }

  return `${actor} updated this ticket`;
}

interface TicketDetailClientProps {
  id: string;
  currentUserId: string | null;
  currentUserRole: UserRole | null;
}

export function TicketDetailClient({
  id,
  currentUserId,
  currentUserRole,
}: TicketDetailClientProps) {
  const [relationSearch, setRelationSearch] = useState('');
  const [relationType, setRelationType] = useState<'RELATED' | 'DUPLICATE' | 'BLOCKS' | 'BLOCKED_BY' | 'PARENT' | 'CHILD'>('RELATED');

  const ticketQuery = useTicket(id);
  const commentsQuery = useTicketComments(id);
  const historyQuery = useTicketHistory(id);
  const watchersQuery = useTicketWatchers(id);
  const relationsQuery = useTicketRelations(id);
  const usersQuery = useUsers();
  const teamsQuery = useTeams();
  const relationCandidatesQuery = useTickets({
    search: relationSearch || undefined,
    limit: 5,
    page: 1,
    sort: 'createdAt',
    order: 'desc',
  });

  const createComment = useCreateComment(id);
  const updateTicket = useUpdateTicket();
  const toggleWatcher = useToggleWatcher(id);
  const addTag = useAddTag(id);
  const removeTag = useRemoveTag(id);
  const addRelation = useAddRelation(id);
  const removeRelation = useRemoveRelation(id);

  const ticket = ticketQuery.data;

  const candidateTickets = useMemo(() => {
    const existingRelationIds = new Set(
      (relationsQuery.data ?? []).map((relation) => relation.relatedTicket.id)
    );

    return (relationCandidatesQuery.data?.tickets ?? []).filter(
      (candidate) => candidate.id !== id && !existingRelationIds.has(candidate.id)
    );
  }, [id, relationCandidatesQuery.data?.tickets, relationsQuery.data]);

  if (ticketQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-[640px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (ticketQuery.isError || !ticket) {
    return (
      <EmptyState
        title="Ticket not found"
        description="The requested ticket could not be loaded."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/tickets" className="hover:text-foreground">
            Tickets
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">#{ticket.number}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="font-mono">
                #{ticket.number}
              </Badge>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl font-bold leading-tight">{ticket.title}</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {renderDescription(ticket.description)}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Comments ({ticket._count.comments})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="h-3.5 w-3.5" />
                History
              </TabsTrigger>
              <TabsTrigger value="attachments" className="gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Attachments
              </TabsTrigger>
              <TabsTrigger value="related" className="gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                Related
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-4">
              <TicketComments
                comments={commentsQuery.data ?? []}
                loading={commentsQuery.isLoading}
                canCreateInternal={
                  currentUserRole === 'ADMIN' ||
                  currentUserRole === 'MANAGER' ||
                  currentUserRole === 'AGENT'
                }
                isSubmitting={createComment.isPending}
                onSubmit={(input) => createComment.mutateAsync(input)}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {historyQuery.isLoading
                      ? Array.from({ length: 4 }).map((_, index) => (
                          <div key={`history-skeleton-${index}`} className="flex gap-3">
                            <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
                            <div className="flex-1 space-y-2 pb-3">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-28" />
                            </div>
                          </div>
                        ))
                      : (historyQuery.data ?? []).map((entry, index, array) => (
                          <div key={entry.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                              {index < array.length - 1 && (
                                <div className="mt-1 w-px flex-1 bg-border" />
                              )}
                            </div>
                            <div className="pb-3">
                              <p className="text-sm">{renderHistoryEntry(entry)}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {format(new Date(entry.createdAt), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                        ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 text-center">
                    <Paperclip className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No attachments yet</p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Attachment uploads are not implemented yet.
                    </p>
                    <Button size="sm" variant="outline" disabled>
                      Upload File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="related" className="mt-4 space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search tickets to relate..."
                        value={relationSearch}
                        onChange={(event) => setRelationSearch(event.target.value)}
                      />
                    </div>
                    <Select
                      value={relationType}
                      onValueChange={(value) =>
                        setRelationType(
                          value as
                            | 'RELATED'
                            | 'DUPLICATE'
                            | 'BLOCKS'
                            | 'BLOCKED_BY'
                            | 'PARENT'
                            | 'CHILD'
                        )
                      }
                    >
                      <SelectTrigger className="w-full sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {relationTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {relationSearch && candidateTickets.length > 0 && (
                    <div className="space-y-2">
                      {candidateTickets.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              #{candidate.number} {candidate.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ticketStatusLabels[candidate.status]}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              addRelation.mutate({
                                targetTicketId: candidate.id,
                                type: relationType,
                              })
                            }
                            disabled={addRelation.isPending}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {relationsQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={`relation-skeleton-${index}`} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : relationsQuery.data && relationsQuery.data.length > 0 ? (
                    <div className="space-y-2">
                      {relationsQuery.data.map((relation) => (
                        <div
                          key={relation.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              #{relation.relatedTicket.number} {relation.relatedTicket.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {relation.direction === 'outgoing' ? 'Outgoing' : 'Incoming'} ·{' '}
                              {relationTypeLabels[relation.type]}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRelation.mutate(relation.id)}
                            disabled={removeRelation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No related tickets found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <TicketSidebar
            ticket={ticket}
            users={usersQuery.data ?? []}
            teams={teamsQuery.data ?? []}
            watchers={watchersQuery.data ?? []}
            currentUserId={currentUserId}
            isUpdating={updateTicket.isPending}
            isTogglingWatcher={toggleWatcher.isPending}
            isAddingTag={addTag.isPending}
            isRemovingTag={removeTag.isPending}
            onStatusChange={(status) => {
              if (status !== ticket.status) {
                updateTicket.mutate({ id, data: { status } });
              }
            }}
            onPriorityChange={(priority) => {
              if (priority !== ticket.priority) {
                updateTicket.mutate({ id, data: { priority } });
              }
            }}
            onAssigneeChange={(assignedToId) => {
              if (assignedToId !== ticket.assignedToId) {
                updateTicket.mutate({ id, data: { assignedToId } });
              }
            }}
            onTeamChange={(teamId) => {
              if (teamId !== ticket.teamId) {
                updateTicket.mutate({ id, data: { teamId } });
              }
            }}
            onToggleWatcher={(isWatching) => toggleWatcher.mutate(isWatching)}
            onAddTag={(name) => addTag.mutateAsync({ name })}
            onRemoveTag={(tagId) => removeTag.mutate(tagId)}
          />
          <TicketAIPanel ticketId={id} />
        </div>
      </div>
    </div>
  );
}
