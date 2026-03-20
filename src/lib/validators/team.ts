import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
});

export const updateTeamSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
  );

export const addTeamMemberSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.string().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
