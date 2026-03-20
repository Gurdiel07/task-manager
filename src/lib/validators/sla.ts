import { z } from "zod";

export const createSLAPolicySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  responseTimeMin: z.number().int().positive("Response time must be positive"),
  resolutionMin: z.number().int().positive("Resolution time must be positive"),
  isActive: z.boolean().optional(),
});

export const updateSLAPolicySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    conditions: z.record(z.string(), z.unknown()).optional(),
    responseTimeMin: z.number().int().positive().optional(),
    resolutionMin: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
  );

export type CreateSLAPolicyInput = z.infer<typeof createSLAPolicySchema>;
export type UpdateSLAPolicyInput = z.infer<typeof updateSLAPolicySchema>;
