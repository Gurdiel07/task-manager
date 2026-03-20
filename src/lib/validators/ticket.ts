import { z } from "zod";

export const ticketStatusValues = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "RESOLVED",
  "CLOSED",
] as const;

export const priorityValues = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
] as const;

export const ticketChannelValues = [
  "EMAIL",
  "CHAT",
  "PHONE",
  "WHATSAPP",
  "SOCIAL",
  "WEB",
  "API",
] as const;

export const relationTypeValues = [
  "DUPLICATE",
  "RELATED",
  "BLOCKS",
  "BLOCKED_BY",
  "PARENT",
  "CHILD",
] as const;

export const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(priorityValues).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  channel: z.enum(ticketChannelValues).optional(),
  assignedToId: z.string().optional(),
  teamId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(ticketStatusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  channel: z.enum(ticketChannelValues).optional(),
  assignedToId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const ticketListQuerySchema = z.object({
  status: z.enum(ticketStatusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  assignedToId: z.string().optional(),
  teamId: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(["createdAt", "updatedAt", "number", "priority", "status", "title"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required"),
  isInternal: z.boolean().optional(),
});

export const ticketWatcherSchema = z.object({
  userId: z.string().optional(),
});

export const ticketTagSchema = z.union([
  z.object({
    tagId: z.string().min(1, "Tag ID is required"),
  }),
  z.object({
    name: z.string().trim().min(1, "Tag name is required").max(50),
  }),
]);

export const ticketRelationSchema = z.object({
  targetTicketId: z.string().min(1, "Target ticket is required"),
  type: z.enum(relationTypeValues),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketListQueryInput = z.infer<typeof ticketListQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type TicketWatcherInput = z.infer<typeof ticketWatcherSchema>;
export type TicketTagInput = z.infer<typeof ticketTagSchema>;
export type TicketRelationInput = z.infer<typeof ticketRelationSchema>;
