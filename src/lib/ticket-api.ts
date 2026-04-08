import type { Session } from "next-auth";
import {
  Prisma,
  type Priority,
  type RelationType,
  type TicketChannel,
  type TicketStatus,
  type UserRole,
} from "@/generated/prisma/client";
import type {
  TicketListQueryInput,
  UpdateTicketInput,
} from "@/lib/validators/ticket";

export const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Prisma.UserSelect;

export const userListSelect = {
  ...userSummarySelect,
  role: true,
} satisfies Prisma.UserSelect;

export const teamSummarySelect = {
  id: true,
  name: true,
} satisfies Prisma.TeamSelect;

export const ticketListInclude = {
  createdBy: { select: userSummarySelect },
  assignedTo: { select: userSummarySelect },
  team: { select: teamSummarySelect },
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.TicketInclude;

export const ticketDetailInclude = {
  ...ticketListInclude,
  _count: {
    select: {
      comments: true,
      watchers: true,
    },
  },
} satisfies Prisma.TicketInclude;

export const ticketCommentInclude = {
  user: {
    select: userSummarySelect,
  },
} satisfies Prisma.TicketCommentInclude;

export const ticketHistoryInclude = {
  user: {
    select: userSummarySelect,
  },
} satisfies Prisma.TicketHistoryInclude;

export const ticketWatcherInclude = {
  user: {
    select: userSummarySelect,
  },
} satisfies Prisma.TicketWatcherInclude;

export const relatedTicketSelect = {
  id: true,
  number: true,
  title: true,
  status: true,
  priority: true,
} satisfies Prisma.TicketSelect;

export const ticketRelationInclude = {
  sourceTicket: {
    select: relatedTicketSelect,
  },
  targetTicket: {
    select: relatedTicketSelect,
  },
} satisfies Prisma.TicketRelationInclude;

const allowedSortFields = new Set<
  NonNullable<TicketListQueryInput["sort"]>
>(["createdAt", "updatedAt", "number", "priority", "status", "title"]);

export const internalCommentRoles: UserRole[] = ["AGENT", "MANAGER", "ADMIN"];
export const managerRoles: UserRole[] = ["MANAGER", "ADMIN"];

export function isManagerRole(role: UserRole) {
  return managerRoles.includes(role);
}

export function canCreateInternalComment(role: UserRole) {
  return internalCommentRoles.includes(role);
}

export function getTicketWhere(filters: TicketListQueryInput): Prisma.TicketWhereInput {
  const andFilters: Prisma.TicketWhereInput[] = [{ deletedAt: null }];

  if (filters.status) {
    andFilters.push({ status: filters.status });
  }

  if (filters.priority) {
    andFilters.push({ priority: filters.priority });
  }

  if (filters.assignedToId === "unassigned") {
    andFilters.push({ assignedToId: null });
  } else if (filters.assignedToId) {
    andFilters.push({ assignedToId: filters.assignedToId });
  }

  if (filters.teamId) {
    andFilters.push({ teamId: filters.teamId });
  }

  if (filters.search) {
    andFilters.push({
      OR: [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ],
    });
  }

  return andFilters.length === 1 ? andFilters[0] : { AND: andFilters };
}

export function getTicketOrderBy(
  sort: NonNullable<TicketListQueryInput["sort"]>,
  order: NonNullable<TicketListQueryInput["order"]>
): Prisma.TicketOrderByWithRelationInput {
  if (!allowedSortFields.has(sort)) {
    return { createdAt: order };
  }

  return { [sort]: order };
}

export function serializeHistoryValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

export function normalizeNullableId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value;
}

export function buildTicketUpdateData(
  input: UpdateTicketInput
): Prisma.TicketUncheckedUpdateInput {
  const data: Prisma.TicketUncheckedUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.category !== undefined) data.category = input.category;
  if (input.subcategory !== undefined) data.subcategory = input.subcategory;
  if (input.channel !== undefined) data.channel = input.channel;
  if (input.assignedToId !== undefined) data.assignedToId = input.assignedToId;
  if (input.teamId !== undefined) data.teamId = input.teamId;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate;

  if (input.status === "RESOLVED") {
    data.resolvedAt = new Date();
  }

  if (input.status === "CLOSED") {
    data.closedAt = new Date();
  }

  return data;
}

export function getChangedTicketFields(
  currentTicket: {
    title: string;
    description: string;
    status: TicketStatus;
    priority: Priority;
    category: string | null;
    subcategory: string | null;
    channel: TicketChannel;
    assignedToId: string | null;
    teamId: string | null;
    dueDate: Date | null;
  },
  nextTicket: UpdateTicketInput
) {
  const changes: Array<{
    field: keyof UpdateTicketInput;
    oldValue: string | null;
    newValue: string | null;
  }> = [];

  const compare = <K extends keyof UpdateTicketInput>(
    field: K,
    currentValue: UpdateTicketInput[K] | Date | null,
    nextValue: UpdateTicketInput[K] | Date | null
  ) => {
    const currentSerialized = serializeHistoryValue(currentValue);
    const nextSerialized = serializeHistoryValue(nextValue);

    if (currentSerialized !== nextSerialized) {
      changes.push({
        field,
        oldValue: currentSerialized,
        newValue: nextSerialized,
      });
    }
  };

  if (nextTicket.title !== undefined) {
    compare("title", currentTicket.title, nextTicket.title);
  }

  if (nextTicket.description !== undefined) {
    compare("description", currentTicket.description, nextTicket.description);
  }

  if (nextTicket.status !== undefined) {
    compare("status", currentTicket.status, nextTicket.status);
  }

  if (nextTicket.priority !== undefined) {
    compare("priority", currentTicket.priority, nextTicket.priority);
  }

  if (nextTicket.category !== undefined) {
    compare("category", currentTicket.category, nextTicket.category);
  }

  if (nextTicket.subcategory !== undefined) {
    compare("subcategory", currentTicket.subcategory, nextTicket.subcategory);
  }

  if (nextTicket.channel !== undefined) {
    compare("channel", currentTicket.channel, nextTicket.channel);
  }

  if (nextTicket.assignedToId !== undefined) {
    compare("assignedToId", currentTicket.assignedToId, nextTicket.assignedToId);
  }

  if (nextTicket.teamId !== undefined) {
    compare("teamId", currentTicket.teamId, nextTicket.teamId);
  }

  if (nextTicket.dueDate !== undefined) {
    compare("dueDate", currentTicket.dueDate, nextTicket.dueDate);
  }

  return changes;
}

export function mapTicketRelations(
  ticketId: string,
  relations: Array<{
    id: string;
    type: RelationType;
    createdAt: Date;
    sourceTicketId: string;
    targetTicketId: string;
    sourceTicket?: {
      id: string;
      number: number;
      title: string;
      status: TicketStatus;
      priority: Priority;
    };
    targetTicket?: {
      id: string;
      number: number;
      title: string;
      status: TicketStatus;
      priority: Priority;
    };
  }>
) {
  return relations.flatMap((relation) => {
    const isOutgoing = relation.sourceTicketId === ticketId;
    const relatedTicket = isOutgoing ? relation.targetTicket : relation.sourceTicket;

    if (!relatedTicket) {
      return [];
    }

    return [{
      id: relation.id,
      type: relation.type,
      direction: isOutgoing ? ("outgoing" as const) : ("incoming" as const),
      createdAt: relation.createdAt,
      relatedTicket,
    }];
  });
}

export function getSessionUser(session: Session | null) {
  return session?.user ?? null;
}
