'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Ticket,
  Plus,
  CheckSquare,
  LayoutDashboard,
  GitBranch,
  BarChart3,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { fetchApi } from '@/hooks/api-client';
import type { PaginatedTicketsResponse } from '@/types/tickets';
import type { PaginatedTasksResponse } from '@/types/tasks';

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState<PaginatedTicketsResponse['tickets']>([]);
  const [tasks, setTasks] = useState<PaginatedTasksResponse['tasks']>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTickets([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const [ticketRes, taskRes] = await Promise.allSettled([
        fetchApi<PaginatedTicketsResponse>(
          `/api/tickets?search=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        ),
        fetchApi<PaginatedTasksResponse>(
          `/api/tasks?search=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        ),
      ]);

      if (!controller.signal.aborted) {
        setTickets(ticketRes.status === 'fulfilled' ? ticketRes.value.tickets : []);
        setTasks(taskRes.status === 'fulfilled' ? taskRes.value.tasks : []);
      }
    } catch {
      // aborted or failed
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => doSearch(search), 250);
    return () => clearTimeout(timeout);
  }, [search, doSearch]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setTickets([]);
      setTasks([]);
    }
  }, [open]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const hasResults = tickets.length > 0 || tasks.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search tickets, tasks, or navigate..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {!loading && search.trim() && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {loading && search.trim() && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {tickets.length > 0 && (
          <CommandGroup heading="Tickets">
            {tickets.map((ticket) => (
              <CommandItem
                key={ticket.id}
                value={`ticket-${ticket.number}-${ticket.title}`}
                onSelect={() =>
                  runCommand(() => router.push(`/tickets/${ticket.id}`))
                }
              >
                <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>#{ticket.number} &mdash; {ticket.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {tasks.length > 0 && (
          <>
            {tickets.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Tasks">
              {tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={`task-${task.title}`}
                  onSelect={() =>
                    runCommand(() => router.push(`/tasks/${task.id}`))
                  }
                >
                  <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{task.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {hasResults && <CommandSeparator />}

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/tickets/new'))}
          >
            <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
            Create New Ticket
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/tasks'))}
          >
            <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
            Create New Task
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/'))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
            Dashboard
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/tickets'))}
          >
            <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
            Tickets
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/workflows'))}
          >
            <GitBranch className="mr-2 h-4 w-4 text-muted-foreground" />
            Workflows
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/analytics'))}
          >
            <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
            Analytics
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/knowledge-base'))}
          >
            <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
            Knowledge Base
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
