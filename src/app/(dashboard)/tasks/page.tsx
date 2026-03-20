'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { Priority, TaskStatus } from '@/generated/prisma/client';
import { TaskFilters } from '@/components/tasks/task-filters';
import { TaskTable } from '@/components/tasks/task-table';
import { TaskForm } from '@/components/tasks/task-form';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTasks, useCreateTask } from '@/hooks/use-tasks';
import { useUsers } from '@/hooks/use-users';
import { toast } from 'sonner';

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const filters = useMemo(
    () => ({
      status: (searchParams.get('status') as TaskStatus | null) ?? undefined,
      priority: (searchParams.get('priority') as Priority | null) ?? undefined,
      assignedToId: searchParams.get('assignedToId') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: Number(searchParams.get('page') ?? '1'),
      limit: 20,
      sort: 'createdAt' as const,
      order: 'desc' as const,
    }),
    [searchParams]
  );

  const tasksQuery = useTasks(filters);
  const usersQuery = useUsers();
  const createTask = useCreateTask();

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          nextParams.delete(key);
          return;
        }
        nextParams.set(key, value);
      });

      router.replace(
        `/tasks${nextParams.toString() ? `?${nextParams.toString()}` : ''}`,
        { scroll: false }
      );
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tasks across all tickets and projects
          </p>
        </div>
        <Button onClick={() => setNewTaskOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <TaskFilters
        key={`${filters.status ?? 'all'}-${filters.priority ?? 'all'}-${
          filters.assignedToId ?? 'all'
        }-${filters.search ?? ''}`}
        filters={filters}
        users={usersQuery.data ?? []}
        usersLoading={usersQuery.isLoading}
        onChange={(nextFilters) =>
          updateSearchParams({
            status: nextFilters.status,
            priority: nextFilters.priority,
            assignedToId: nextFilters.assignedToId,
            search: nextFilters.search,
            page: nextFilters.page ? String(nextFilters.page) : '1',
          })
        }
        onClear={() =>
          updateSearchParams({
            status: undefined,
            priority: undefined,
            assignedToId: undefined,
            search: undefined,
            page: '1',
          })
        }
      />

      <div>
        {!tasksQuery.isLoading && (tasksQuery.data?.tasks.length ?? 0) === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Try changing your filters or create a new task."
          />
        ) : (
          <TaskTable
            tasks={tasksQuery.data?.tasks ?? []}
            loading={tasksQuery.isLoading}
          />
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {tasksQuery.data?.tasks.length ?? 0} of{' '}
            {tasksQuery.data?.total ?? 0} tasks
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(tasksQuery.data?.page ?? 1) <= 1}
              onClick={() =>
                updateSearchParams({
                  page: String(Math.max(1, (tasksQuery.data?.page ?? 1) - 1)),
                })
              }
            >
              Previous
            </Button>
            {Array.from(
              { length: tasksQuery.data?.totalPages ?? 1 },
              (_, i) => i + 1
            )
              .slice(0, 5)
              .map((page) => (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  className={
                    page === (tasksQuery.data?.page ?? 1)
                      ? 'bg-primary text-primary-foreground'
                      : ''
                  }
                  onClick={() => updateSearchParams({ page: String(page) })}
                >
                  {page}
                </Button>
              ))}
            <Button
              variant="outline"
              size="sm"
              disabled={
                (tasksQuery.data?.page ?? 1) >=
                (tasksQuery.data?.totalPages ?? 1)
              }
              onClick={() =>
                updateSearchParams({
                  page: String(
                    Math.min(
                      tasksQuery.data?.totalPages ?? 1,
                      (tasksQuery.data?.page ?? 1) + 1
                    )
                  ),
                })
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            isSubmitting={createTask.isPending}
            onSubmit={(data) => {
              createTask.mutate(data, {
                onSuccess: () => {
                  setNewTaskOpen(false);
                  toast.success('Task created successfully');
                },
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
