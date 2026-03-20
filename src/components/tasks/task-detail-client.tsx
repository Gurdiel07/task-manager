'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Clock,
  GitBranch,
  Link2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/empty-state';
import { PriorityBadge } from '@/components/shared/priority-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { getInitials } from '@/lib/ticket-options';
import {
  useTask,
  useUpdateTask,
  useToggleChecklistItem,
  useCreateChecklistItem,
  useDeleteChecklistItem,
  useBulkReorderChecklist,
  useAddDependency,
  useRemoveDependency,
} from '@/hooks/use-tasks';
import { useTasks } from '@/hooks/use-tasks';
import { useUsers } from '@/hooks/use-users';

const taskStatusOptions = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

interface TaskDetailClientProps {
  id: string;
}

export function TaskDetailClient({ id }: TaskDetailClientProps) {
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [depSearch, setDepSearch] = useState('');

  const taskQuery = useTask(id);
  const task = taskQuery.data;

  const updateTask = useUpdateTask();
  const toggleChecklist = useToggleChecklistItem(id);
  const createChecklistItem = useCreateChecklistItem(id);
  const deleteChecklistItem = useDeleteChecklistItem(id);
  const reorderChecklist = useBulkReorderChecklist(id);
  const addDependency = useAddDependency(id);
  const removeDependency = useRemoveDependency(id);

  const usersQuery = useUsers();

  const depCandidatesQuery = useTasks({
    search: depSearch || undefined,
    limit: 5,
    page: 1,
    sort: 'createdAt',
    order: 'desc',
  });

  if (taskQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (taskQuery.isError || !task) {
    return (
      <EmptyState
        title="Task not found"
        description="The requested task could not be loaded."
      />
    );
  }

  const completedCount = task.checklist.filter((c) => c.isCompleted).length;
  const totalCount = task.checklist.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const existingDepIds = new Set([
    ...task.dependencies.map((d) => d.dependsOnId),
    id,
  ]);

  const depCandidates = (depCandidatesQuery.data?.tasks ?? []).filter(
    (t) => !existingDepIds.has(t.id)
  );

  const handleMoveChecklist = (index: number, direction: 'up' | 'down') => {
    const items = [...task.checklist];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;

    const reordered = items.map((item, i) => {
      if (i === index) return { id: items[swapIndex].id, order: item.order };
      if (i === swapIndex) return { id: items[index].id, order: items[swapIndex].order };
      return { id: item.id, order: item.order };
    });

    reorderChecklist.mutate(reordered);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;
    createChecklistItem.mutate(
      { title: newChecklistTitle.trim() },
      { onSuccess: () => setNewChecklistTitle('') }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Link href="/tasks" className="hover:text-foreground">
            Tasks
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate">{task.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <h1 className="text-xl font-bold leading-tight">{task.title}</h1>
          </div>

          {task.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Checklist */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Checklist
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{totalCount} completed
                </span>
              </div>
              {totalCount > 0 && (
                <Progress value={progressPercent} className="h-1.5 mt-2" />
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {task.checklist.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <Checkbox
                    id={item.id}
                    checked={item.isCompleted}
                    onCheckedChange={(checked) =>
                      toggleChecklist.mutate({
                        id: item.id,
                        isCompleted: Boolean(checked),
                      })
                    }
                  />
                  <Label
                    htmlFor={item.id}
                    className={`flex-1 text-sm cursor-pointer ${
                      item.isCompleted
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {item.title}
                  </Label>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveChecklist(index, 'up')}
                      disabled={index === 0 || reorderChecklist.isPending}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveChecklist(index, 'down')}
                      disabled={
                        index === task.checklist.length - 1 ||
                        reorderChecklist.isPending
                      }
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => deleteChecklistItem.mutate(item.id)}
                      disabled={deleteChecklistItem.isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="Add checklist item..."
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={handleAddChecklistItem}
                  disabled={
                    !newChecklistTitle.trim() || createChecklistItem.isPending
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dependencies */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Dependencies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.dependencies.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    This task depends on:
                  </p>
                  <div className="space-y-2">
                    {task.dependencies.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {dep.dependsOn.status !== 'DONE' && (
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                          )}
                          <Link
                            href={`/tasks/${dep.dependsOn.id}`}
                            className="text-sm font-medium hover:text-primary truncate"
                          >
                            {dep.dependsOn.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={dep.dependsOn.status} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeDependency.mutate(dep.id)}
                            disabled={removeDependency.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {task.dependents.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Tasks that depend on this:
                  </p>
                  <div className="space-y-2">
                    {task.dependents.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-dashed"
                      >
                        <Link
                          href={`/tasks/${dep.task.id}`}
                          className="text-sm font-medium hover:text-primary truncate"
                        >
                          {dep.task.title}
                        </Link>
                        <StatusBadge status={dep.task.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 h-8 text-sm"
                    placeholder="Search tasks to add as dependency..."
                    value={depSearch}
                    onChange={(e) => setDepSearch(e.target.value)}
                  />
                </div>
                {depSearch && depCandidates.length > 0 && (
                  <div className="space-y-1.5">
                    {depCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between rounded-lg border p-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {candidate.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {candidate.status}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs ml-2 shrink-0"
                          onClick={() => {
                            addDependency.mutate(
                              { dependsOnId: candidate.id },
                              { onSuccess: () => setDepSearch('') }
                            );
                          }}
                          disabled={addDependency.isPending}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {depSearch &&
                  !depCandidatesQuery.isLoading &&
                  depCandidates.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No tasks found
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Linked ticket */}
          {task.ticket && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Linked Ticket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/tickets/${task.ticket.id}`}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border hover:bg-muted transition-colors group"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                    <span className="text-[10px] font-mono font-bold">#</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground">
                      #{task.ticket.number}
                    </p>
                    <p className="text-xs font-medium group-hover:text-primary truncate">
                      {task.ticket.title}
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Linked workflow step */}
          {task.workflowInstanceStep && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Linked Workflow Step
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-2.5 rounded-lg bg-muted/50 border space-y-1">
                  <p className="text-sm font-medium">
                    {task.workflowInstanceStep.step.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Step: {task.workflowInstanceStep.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Instance: {task.workflowInstanceStep.instance.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                <Select
                  value={task.status}
                  onValueChange={(value) => {
                    if (value !== task.status) {
                      updateTask.mutate({
                        id,
                        data: { status: value as typeof task.status },
                      });
                    }
                  }}
                  disabled={updateTask.isPending}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Priority</p>
                <Select
                  value={task.priority}
                  onValueChange={(value) => {
                    if (value !== task.priority) {
                      updateTask.mutate({
                        id,
                        data: { priority: value as typeof task.priority },
                      });
                    }
                  }}
                  disabled={updateTask.isPending}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Assignee</p>
                <Select
                  value={task.assignedToId ?? 'unassigned'}
                  onValueChange={(value) => {
                    const next = value === 'unassigned' ? null : value;
                    if (next !== task.assignedToId) {
                      updateTask.mutate({ id, data: { assignedToId: next } });
                    }
                  }}
                  disabled={updateTask.isPending || usersQuery.isLoading}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {(usersQuery.data ?? []).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name ?? user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {task.assignedTo && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                        {getInitials(
                          task.assignedTo.name ?? task.assignedTo.email
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {task.assignedTo.name ?? task.assignedTo.email}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Due Date
                </p>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  defaultValue={
                    task.dueDate
                      ? format(new Date(task.dueDate), 'yyyy-MM-dd')
                      : ''
                  }
                  onBlur={(e) => {
                    const newDate = e.target.value
                      ? new Date(e.target.value)
                      : null;
                    const currentDate = task.dueDate
                      ? format(new Date(task.dueDate), 'yyyy-MM-dd')
                      : '';
                    if (e.target.value !== currentDate) {
                      updateTask.mutate({ id, data: { dueDate: newDate } });
                    }
                  }}
                  disabled={updateTask.isPending}
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Estimated Hours
                </p>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  className="h-8 text-sm"
                  defaultValue={task.estimatedHours ?? ''}
                  placeholder="—"
                  onBlur={(e) => {
                    const newVal = e.target.value ? Number(e.target.value) : null;
                    if (newVal !== task.estimatedHours) {
                      updateTask.mutate({ id, data: { estimatedHours: newVal } });
                    }
                  }}
                  disabled={updateTask.isPending}
                />
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-xs font-medium">
                    {task.createdBy.name ?? task.createdBy.email}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-xs">
                    {format(new Date(task.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
                {task.completedAt && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-xs">
                      {format(new Date(task.completedAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                )}
              </div>

              {task.status !== 'DONE' && (
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() =>
                    updateTask.mutate({ id, data: { status: 'DONE' } })
                  }
                  disabled={updateTask.isPending}
                >
                  Mark as Done
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
