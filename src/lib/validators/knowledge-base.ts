import { z } from "zod";

export const createKBCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateKBCategorySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    order: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
  );

export const createKBArticleSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const updateKBArticleSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    content: z.string().min(1).optional(),
    categoryId: z.string().nullable().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
  );

export const kbArticleListQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  categoryId: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateKBCategoryInput = z.infer<typeof createKBCategorySchema>;
export type UpdateKBCategoryInput = z.infer<typeof updateKBCategorySchema>;
export type CreateKBArticleInput = z.infer<typeof createKBArticleSchema>;
export type UpdateKBArticleInput = z.infer<typeof updateKBArticleSchema>;
export type KBArticleListQueryInput = z.infer<typeof kbArticleListQuerySchema>;
