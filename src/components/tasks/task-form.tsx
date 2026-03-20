'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTaskSchema } from '@/lib/validators/task';
import { useUsers } from '@/hooks/use-users';
import type { TaskListItem } from '@/types/tasks';

type CreateTaskFormValues = z.input<typeof createTaskSchema>;

interface TaskFormProps {
  defaultValues?: Partial<CreateTaskFormValues>;
  onSubmit: (data: CreateTaskFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const priorityOptions = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export function TaskForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Create Task',
}: TaskFormProps) {
  const usersQuery = useUsers();

  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      assignedToId: undefined,
      ticketId: undefined,
      dueDate: undefined,
      estimatedHours: undefined,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({ ...form.getValues(), ...defaultValues });
    }
  }, []);

  const handleSubmit = form.handleSubmit((data) => {
    const cleaned: CreateTaskFormValues = {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      assignedToId: data.assignedToId || undefined,
      ticketId: data.ticketId || undefined,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
    };
    onSubmit(cleaned);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Task title"
          {...form.register('title')}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the task..."
          rows={3}
          {...form.register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={form.watch('priority') ?? 'MEDIUM'}
            onValueChange={(value) =>
              form.setValue('priority', value as CreateTaskFormValues['priority'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
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

        <div className="space-y-1.5">
          <Label>Assignee</Label>
          <Select
            value={form.watch('assignedToId') ?? 'unassigned'}
            onValueChange={(value) =>
              form.setValue(
                'assignedToId',
                value === 'unassigned' ? undefined : value
              )
            }
            disabled={usersQuery.isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assignee" />
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">
            <CalendarDays className="inline h-3.5 w-3.5 mr-1" />
            Due Date
          </Label>
          <Input
            id="dueDate"
            type="date"
            {...form.register('dueDate', {
              setValueAs: (v) => (v ? new Date(v) : undefined),
            })}
            defaultValue={
              defaultValues?.dueDate
                ? format(new Date(defaultValues.dueDate as Date), 'yyyy-MM-dd')
                : undefined
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 4"
            {...form.register('estimatedHours', {
              setValueAs: (v) => (v === '' ? undefined : Number(v)),
            })}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
