'use client';

import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskFilters } from '@/types/tasks';
import type { UserListItem } from '@/types/tickets';

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

interface TaskFiltersProps {
  filters: TaskFilters;
  users: UserListItem[];
  usersLoading?: boolean;
  onChange: (next: Partial<TaskFilters>) => void;
  onClear: () => void;
}

export function TaskFilters({
  filters,
  users,
  usersLoading,
  onChange,
  onClear,
}: TaskFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? '');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchValue !== (filters.search ?? '')) {
        onChange({ search: searchValue || undefined, page: 1 });
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [filters.search, onChange, searchValue]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-48 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-9"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <Select
        value={filters.status ?? 'all'}
        onValueChange={(value) =>
          onChange({
            status: value === 'all' ? undefined : (value as TaskFilters['status']),
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {taskStatusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority ?? 'all'}
        onValueChange={(value) =>
          onChange({
            priority: value === 'all' ? undefined : (value as TaskFilters['priority']),
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {priorityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.assignedToId ?? 'all'}
        onValueChange={(value) =>
          onChange({ assignedToId: value === 'all' ? undefined : value, page: 1 })
        }
        disabled={usersLoading}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name ?? user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" size="sm" onClick={onClear}>
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Clear filters
      </Button>
    </div>
  );
}
