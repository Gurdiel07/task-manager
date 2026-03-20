import type {
  InstanceStatus,
  Priority,
  StepStatus,
  TaskStatus,
} from "@/generated/prisma/client";

export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface TicketSummary {
  id: string;
  number: number;
  title: string;
}

export interface WorkflowStepSummary {
  id: string;
  name: string;
}

export interface WorkflowInstanceSummary {
  id: string;
  status: InstanceStatus;
}

export interface WorkflowInstanceStepSummary {
  id: string;
  status: StepStatus;
  step: WorkflowStepSummary;
  instance: WorkflowInstanceSummary;
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

export interface TaskDependencyTaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface TaskDependencyItem {
  id: string;
  taskId: string;
  dependsOnId: string;
  dependsOn: TaskDependencyTaskSummary;
}

export interface TaskDependentItem {
  id: string;
  taskId: string;
  dependsOnId: string;
  task: TaskDependencyTaskSummary;
}

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  ticketId: string | null;
  workflowInstanceStepId: string | null;
  createdById: string;
  assignedToId: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
  ticket: TicketSummary | null;
}

export interface TaskDetail extends TaskListItem {
  workflowInstanceStep: WorkflowInstanceStepSummary | null;
  checklist: TaskChecklistItem[];
  dependencies: TaskDependencyItem[];
  dependents: TaskDependentItem[];
}

export interface PaginatedTasksResponse {
  tasks: TaskListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assignedToId?: string;
  ticketId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "createdAt" | "updatedAt" | "priority" | "status" | "title" | "dueDate";
  order?: "asc" | "desc";
}
