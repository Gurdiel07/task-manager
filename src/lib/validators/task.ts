import { z } from "zod";

export const taskStatusValues = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELLED",
] as const;

export const priorityValues = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
] as const;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: z.enum(priorityValues).optional(),
  ticketId: z.string().optional(),
  workflowInstanceStepId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.number().positive().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  assignedToId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
});

export const taskListQuerySchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  assignedToId: z.string().optional(),
  ticketId: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(["createdAt", "updatedAt", "priority", "status", "title", "dueDate"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const createChecklistItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  order: z.number().int().min(0).optional(),
});

export const updateChecklistItemSchema = z.object({
  id: z.string().min(1, "Item ID is required"),
  title: z.string().min(1).optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const bulkReorderChecklistSchema = z.array(
  z.object({
    id: z.string().min(1),
    order: z.number().int().min(0),
  })
);

export const addDependencySchema = z.object({
  dependsOnId: z.string().min(1, "Dependency task ID is required"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQueryInput = z.infer<typeof taskListQuerySchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type BulkReorderChecklistInput = z.infer<typeof bulkReorderChecklistSchema>;
export type AddDependencyInput = z.infer<typeof addDependencySchema>;
