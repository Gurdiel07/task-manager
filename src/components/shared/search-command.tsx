'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tickets, tasks, or navigate..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Recent Tickets">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/tickets/1234'))
            }
          >
            <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>#1234 — Login page returns 500 error</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/tickets/1233'))
            }
          >
            <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>#1233 — Customer unable to reset password</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/tickets/1232'))
            }
          >
            <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>#1232 — Payment gateway timeout</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

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
