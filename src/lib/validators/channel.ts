import { z } from "zod";

export const ticketChannelValues = [
  "EMAIL",
  "CHAT",
  "PHONE",
  "WHATSAPP",
  "SOCIAL",
  "WEB",
  "API",
] as const;

export const createChannelSchema = z.object({
  type: z.enum(ticketChannelValues),
  name: z.string().min(1, "Name is required").max(255),
  config: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const updateChannelSchema = z
  .object({
    type: z.enum(ticketChannelValues).optional(),
    name: z.string().min(1).max(255).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
  );

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
