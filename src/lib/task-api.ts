import { Prisma } from "@/generated/prisma/client";
import type { Session } from "next-auth";
import type { TaskListQueryInput } from "@/lib/validators/task";

export const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Prisma.UserSelect;

const taskTicketSelect = {
  id: true,
  number: true,
  title: true,
} satisfies Prisma.TicketSelect;

const workflowStepSelect = {
  id: true,
  name: true,
} satisfies Prisma.WorkflowStepSelect;

const workflowInstanceSelect = {
  id: true,
  status: true,
} satisfies Prisma.WorkflowInstanceSelect;

const dependencyTaskSelect = {
  id: true,
  title: true,
  status: true,
} satisfies Prisma.TaskSelect;

export const taskListInclude = {
  createdBy: { select: userSummarySelect },
  assignedTo: { select: userSummarySelect },
  ticket: { select: taskTicketSelect },
} satisfies Prisma.TaskInclude;

export const taskDetailInclude = {
  createdBy: { select: userSummarySelect },
  assignedTo: { select: userSummarySelect },
  ticket: { select: taskTicketSelect },
  workflowInstanceStep: {
    include: {
      step: { select: workflowStepSelect },
      instance: { select: workflowInstanceSelect },
    },
  },
  checklist: {
    orderBy: { order: "asc" as const },
  },
  dependencies: {
    include: {
      dependsOn: { select: dependencyTaskSelect },
    },
  },
  dependents: {
    include: {
      task: { select: dependencyTaskSelect },
    },
  },
} satisfies Prisma.TaskInclude;

const allowedSortFields = new Set<NonNullable<TaskListQueryInput["sort"]>>([
  "createdAt",
  "updatedAt",
  "priority",
  "status",
  "title",
  "dueDate",
]);

export function getTaskWhere(
  filters: TaskListQueryInput
): Prisma.TaskWhereInput {
  const andFilters: Prisma.TaskWhereInput[] = [{ deletedAt: null }];

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

  if (filters.ticketId) {
    andFilters.push({ ticketId: filters.ticketId });
  }

  if (filters.search) {
    andFilters.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  return andFilters.length === 1 ? andFilters[0] : { AND: andFilters };
}

export function getTaskOrderBy(
  sort: NonNullable<TaskListQueryInput["sort"]>,
  order: NonNullable<TaskListQueryInput["order"]>
): Prisma.TaskOrderByWithRelationInput {
  if (!allowedSortFields.has(sort)) {
    return { createdAt: order };
  }

  return { [sort]: order };
}

export function getSessionUser(session: Session | null) {
  return session?.user ?? null;
}
