import { z } from "zod";

export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  category: z.string().optional(),
});

export const updateWorkflowTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createWorkflowStepSchema = z.object({
  name: z.string().min(1, "Step name is required").max(255),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  type: z
    .enum(["MANUAL", "AUTOMATIC", "APPROVAL", "CONDITION", "NOTIFICATION"])
    .default("MANUAL"),
  config: z.record(z.string(), z.unknown()).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

export const bulkUpdateStepsSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1).max(255).optional(),
      description: z.string().nullable().optional(),
      type: z
        .enum(["MANUAL", "AUTOMATIC", "APPROVAL", "CONDITION", "NOTIFICATION"])
        .optional(),
      config: z.record(z.string(), z.unknown()).nullable().optional(),
      positionX: z.number().optional(),
      positionY: z.number().optional(),
      order: z.number().int().min(0).optional(),
    })
  )
  .min(1, "At least one step update is required");

export const createWorkflowTransitionSchema = z.object({
  fromStepId: z.string().min(1, "Source step is required"),
  toStepId: z.string().min(1, "Target step is required"),
  label: z.string().optional(),
  condition: z.record(z.string(), z.unknown()).optional(),
});

export const workflowListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createWorkflowInstanceSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
});

export const stepActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("complete"),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    action: z.literal("skip"),
  }),
  z.object({
    action: z.literal("fail"),
    data: z.object({
      reason: z.string().min(1, "Reason is required"),
    }),
  }),
  z.object({
    action: z.literal("assign"),
    assignedToId: z.string().min(1, "User ID is required"),
  }),
  z.object({
    action: z.literal("advance"),
    targetStepId: z.string().min(1, "Target step ID is required"),
  }),
]);

export const instanceActionSchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
});

export const createSnapshotSchema = z.object({
  note: z.string().optional(),
});

export type CreateWorkflowTemplateInput = z.infer<
  typeof createWorkflowTemplateSchema
>;
export type UpdateWorkflowTemplateInput = z.infer<
  typeof updateWorkflowTemplateSchema
>;
export type CreateWorkflowStepInput = z.infer<typeof createWorkflowStepSchema>;
export type BulkUpdateStepsInput = z.infer<typeof bulkUpdateStepsSchema>;
export type CreateWorkflowTransitionInput = z.infer<
  typeof createWorkflowTransitionSchema
>;
export type WorkflowListQueryInput = z.infer<typeof workflowListQuerySchema>;
export type CreateWorkflowInstanceInput = z.infer<
  typeof createWorkflowInstanceSchema
>;
export type StepActionInput = z.infer<typeof stepActionSchema>;
export type InstanceActionInput = z.infer<typeof instanceActionSchema>;
export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>;
