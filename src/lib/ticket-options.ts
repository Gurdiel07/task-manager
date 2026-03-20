import type {
  Priority,
  RelationType,
  TicketStatus,
} from '@/generated/prisma/client';
import {
  priorityValues,
  relationTypeValues,
  ticketStatusValues,
} from '@/lib/validators/ticket';

export const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const priorityLabels: Record<Priority, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const relationTypeLabels: Record<RelationType, string> = {
  DUPLICATE: 'Duplicate',
  RELATED: 'Related',
  BLOCKS: 'Blocks',
  BLOCKED_BY: 'Blocked By',
  PARENT: 'Parent',
  CHILD: 'Child',
};

export const ticketStatusOptions = ticketStatusValues.map((value) => ({
  value,
  label: ticketStatusLabels[value],
}));

export const priorityOptions = priorityValues.map((value) => ({
  value,
  label: priorityLabels[value],
}));

export const relationTypeOptions = relationTypeValues.map((value) => ({
  value,
  label: relationTypeLabels[value],
}));

export function getInitials(name?: string | null) {
  if (!name) {
    return 'NA';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
