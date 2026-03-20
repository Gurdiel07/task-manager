import type {
  InstanceStatus,
  StepStatus,
  WorkflowStepType,
} from "@/generated/prisma/client";
import type { UserSummary } from "./tickets";

export interface WorkflowStepItem {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  order: number;
  type: WorkflowStepType;
  config: Record<string, unknown> | null;
  positionX: number;
  positionY: number;
}

export interface WorkflowTransitionItem {
  id: string;
  templateId: string;
  fromStepId: string;
  toStepId: string;
  label: string | null;
  condition: Record<string, unknown> | null;
}

export interface WorkflowTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    steps: number;
    instances: number;
  };
}

export interface WorkflowTemplateDetail {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  steps: WorkflowStepItem[];
  transitions: WorkflowTransitionItem[];
  createdBy: UserSummary;
  _count: {
    steps: number;
    instances: number;
  };
}

export interface WorkflowInstanceListItem {
  id: string;
  templateId: string;
  ticketId: string;
  currentStepId: string | null;
  status: InstanceStatus;
  data: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
  ticket: {
    id: string;
    number: number;
    title: string;
  };
  currentStep: {
    id: string;
    name: string;
  } | null;
}

export interface WorkflowInstanceStepItem {
  id: string;
  instanceId: string;
  stepId: string;
  status: StepStatus;
  assignedToId: string | null;
  data: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  step: WorkflowStepItem;
  assignedTo: UserSummary | null;
}

export interface WorkflowSnapshotItem {
  id: string;
  instanceId: string;
  snapshotData: Record<string, unknown>;
  note: string | null;
  createdById: string;
  createdAt: string;
  createdBy: UserSummary;
}

export interface WorkflowInstanceDetail {
  id: string;
  templateId: string;
  ticketId: string;
  currentStepId: string | null;
  status: InstanceStatus;
  data: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
  template: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
  };
  ticket: {
    id: string;
    number: number;
    title: string;
  };
  steps: WorkflowInstanceStepItem[];
  snapshots: WorkflowSnapshotItem[];
}

export interface PaginatedWorkflowsResponse {
  templates: WorkflowTemplateListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface WorkflowFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
