'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import {
  createKBArticleSchema,
  createKBCategorySchema,
  updateKBArticleSchema,
  updateKBCategorySchema,
} from '@/lib/validators/knowledge-base';
import type {
  KBArticleDetail,
  KBArticleFilters,
  KBArticleListItem,
  KBCategoryItem,
  PaginatedKBArticlesResponse,
} from '@/types/knowledge-base';

type CreateCategoryPayload = z.input<typeof createKBCategorySchema>;
type UpdateCategoryPayload = z.input<typeof updateKBCategorySchema>;
type CreateArticlePayload = z.input<typeof createKBArticleSchema>;
type UpdateArticlePayload = z.input<typeof updateKBArticleSchema>;

const kbKeys = {
  all: ['knowledge-base'] as const,
  categories: () => ['knowledge-base', 'categories'] as const,
  category: (id: string) => ['knowledge-base', 'categories', id] as const,
  articles: (filters: KBArticleFilters) => ['knowledge-base', 'articles', filters] as const,
  article: (id: string) => ['knowledge-base', 'articles', id] as const,
};

export function useKBCategories() {
  return useQuery({
    queryKey: kbKeys.categories(),
    queryFn: () => fetchApi<KBCategoryItem[]>('/api/knowledge-base/categories'),
  });
}

export function useCreateKBCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryPayload) =>
      fetchApi<KBCategoryItem>('/api/knowledge-base/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kbKeys.categories() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateKBCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryPayload }) =>
      fetchApi<KBCategoryItem>(`/api/knowledge-base/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: kbKeys.categories() });
      queryClient.invalidateQueries({ queryKey: kbKeys.category(variables.id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteKBCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/knowledge-base/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kbKeys.categories() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useKBArticles(filters: KBArticleFilters = {}) {
  return useQuery({
    queryKey: kbKeys.articles(filters),
    queryFn: () =>
      fetchApi<PaginatedKBArticlesResponse>(
        `/api/knowledge-base/articles${buildQueryString({
          status: filters.status,
          categoryId: filters.categoryId,
          search: filters.search,
          page: filters.page,
          limit: filters.limit,
        })}`
      ),
  });
}

export function useKBArticle(id: string) {
  return useQuery({
    queryKey: kbKeys.article(id),
    queryFn: () => fetchApi<KBArticleDetail>(`/api/knowledge-base/articles/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateKBArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArticlePayload) =>
      fetchApi<KBArticleListItem>('/api/knowledge-base/articles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', 'articles'] });
      toast.success('Article created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateKBArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticlePayload }) =>
      fetchApi<KBArticleDetail>(`/api/knowledge-base/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', 'articles'] });
      queryClient.invalidateQueries({ queryKey: kbKeys.article(variables.id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteKBArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/knowledge-base/articles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', 'articles'] });
      toast.success('Article deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useMarkHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ id: string; helpfulCount: number }>(
        `/api/knowledge-base/articles/${id}/helpful`,
        { method: 'POST' }
      ),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: kbKeys.article(id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export { kbKeys };
