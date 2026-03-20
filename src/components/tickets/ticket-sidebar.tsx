'use client';

import { useMemo, useState } from 'react';
import { differenceInMinutes, format } from 'date-fns';
import { AlertCircle, CalendarDays, Clock, Eye, Tag, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getInitials, priorityOptions, ticketStatusOptions } from '@/lib/ticket-options';
import type {
  TeamSummary,
  TicketDetail,
  TicketWatcherItem,
  UserListItem,
} from '@/types/tickets';

interface TicketSidebarProps {
  ticket: TicketDetail;
  users: UserListItem[];
  teams: TeamSummary[];
  watchers: TicketWatcherItem[];
  currentUserId: string | null;
  isUpdating?: boolean;
  isTogglingWatcher?: boolean;
  isAddingTag?: boolean;
  isRemovingTag?: boolean;
  onStatusChange: (status: TicketDetail['status']) => void;
  onPriorityChange: (priority: TicketDetail['priority']) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
  onTeamChange: (teamId: string | null) => void;
  onToggleWatcher: (isWatching: boolean) => void;
  onAddTag: (name: string) => Promise<unknown>;
  onRemoveTag: (tagId: string) => void;
}

export function TicketSidebar({
  ticket,
  users,
  teams,
  watchers,
  currentUserId,
  isUpdating,
  isTogglingWatcher,
  isAddingTag,
  isRemovingTag,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onTeamChange,
  onToggleWatcher,
  onAddTag,
  onRemoveTag,
}: TicketSidebarProps) {
  const [isAddingTagFieldVisible, setIsAddingTagFieldVisible] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const isWatching = useMemo(
    () => watchers.some((watcher) => watcher.userId === currentUserId),
    [currentUserId, watchers]
  );

  const dueDateMetrics = useMemo(() => {
    if (!ticket.dueDate) {
      return null;
    }

    const createdAt = new Date(ticket.createdAt);
    const dueDate = new Date(ticket.dueDate);
    const now = new Date();
    const totalMinutes = Math.max(1, differenceInMinutes(dueDate, createdAt));
    const remainingMinutes = differenceInMinutes(dueDate, now);
    const elapsedMinutes = totalMinutes - remainingMinutes;

    return {
      remainingMinutes,
      progress: Math.min(100, Math.max(0, (elapsedMinutes / totalMinutes) * 100)),
    };
  }, [ticket.createdAt, ticket.dueDate]);

  async function handleAddTag() {
    if (!tagInput.trim()) {
      setIsAddingTagFieldVisible(false);
      return;
    }

    await onAddTag(tagInput.trim());
    setTagInput('');
    setIsAddingTagFieldVisible(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Ticket Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Status</p>
          <Select
            value={ticket.status}
            onValueChange={(value) => onStatusChange(value as TicketDetail['status'])}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ticketStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Priority</p>
          <Select
            value={ticket.priority}
            onValueChange={(value) => onPriorityChange(value as TicketDetail['priority'])}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Assignee</p>
            <UserPlus className="h-3 w-3 text-muted-foreground" />
          </div>
          <Select
            value={ticket.assignedToId ?? 'none'}
            onValueChange={(value) => onAssigneeChange(value === 'none' ? null : value)}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Team</p>
          <Select
            value={ticket.teamId ?? 'none'}
            onValueChange={(value) => onTeamChange(value === 'none' ? null : value)}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No team</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            <CalendarDays className="mr-1 inline h-3 w-3" />
            Due Date
          </p>
          <p className="text-sm font-medium">
            {ticket.dueDate
              ? format(new Date(ticket.dueDate), 'MMM d, yyyy')
              : 'No due date'}
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Channel</p>
          <p className="text-sm">{ticket.channel}</p>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Category</p>
          <p className="text-sm">{ticket.category ?? 'Uncategorized'}</p>
        </div>

        <Separator />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <Tag className="mr-1 inline h-3 w-3" />
              Tags
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setIsAddingTagFieldVisible((value) => !value)}
            >
              <span className="text-xs">+</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {ticket.tags.map((tagRelation) => (
              <Badge key={tagRelation.tagId} variant="secondary" className="gap-1 text-xs">
                {tagRelation.tag.name}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tagRelation.tagId)}
                  disabled={isRemovingTag}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
            {ticket.tags.length === 0 && (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </div>
          {isAddingTagFieldVisible && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="New tag name"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleAddTag();
                  }
                }}
              />
              <Button size="sm" onClick={() => void handleAddTag()} disabled={isAddingTag}>
                Add
              </Button>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <Eye className="mr-1 inline h-3 w-3" />
              Watchers
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onToggleWatcher(isWatching)}
              disabled={isTogglingWatcher || !currentUserId}
            >
              {isWatching ? 'Unwatch' : 'Watch'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {watchers.map((watcher) => (
              <Avatar key={watcher.id} className="h-6 w-6">
                <AvatarFallback className="bg-muted text-[9px] font-semibold text-muted-foreground">
                  {getInitials(watcher.user.name ?? watcher.user.email)}
                </AvatarFallback>
              </Avatar>
            ))}
            {watchers.length === 0 && (
              <span className="text-xs text-muted-foreground">No watchers</span>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              Due Date Status
            </p>
          </div>
          {dueDateMetrics ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Time remaining</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {dueDateMetrics.remainingMinutes > 0
                    ? `${dueDateMetrics.remainingMinutes}min`
                    : 'Past due'}
                </span>
              </div>
              <Progress value={dueDateMetrics.progress} className="h-2" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No due date set</p>
          )}
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              Created
            </p>
            <p className="text-xs">
              {format(new Date(ticket.createdAt), 'MMM d, h:mm a')}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Updated</p>
            <p className="text-xs">
              {format(new Date(ticket.updatedAt), 'MMM d, h:mm a')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
