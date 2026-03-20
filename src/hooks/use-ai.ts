'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import { ticketKeys } from '@/hooks/use-tickets';
import {
  analyzeTicketSchema,
  automationRuleCreateSchema,
  automationRuleParseSchema,
  automationRuleUpdateSchema,
  createAIProviderConfigSchema,
  predictionAcceptanceSchema,
  predictionRequestSchema,
  updateAIProviderConfigSchema,
} from '@/lib/validators/ai';
import type {
  AIProviderConfigItem,
  AIPredictionItem,
  AutomationRuleDetail,
  AutomationRuleItem,
  ParsedRuleResult,
  PredictionResult,
  TicketAnalysis,
} from '@/types/ai';

type CreateAIProviderPayload = z.input<typeof createAIProviderConfigSchema>;
type UpdateAIProviderPayload = z.input<typeof updateAIProviderConfigSchema>;
type PredictionRequestPayload = z.input<typeof predictionRequestSchema>;
type PredictionAcceptancePayload = z.input<typeof predictionAcceptanceSchema>;
type AnalyzeTicketPayload = z.input<typeof analyzeTicketSchema>;
type CreateAutomationRulePayload = z.input<typeof automationRuleCreateSchema>;
type UpdateAutomationRulePayload = z.input<typeof automationRuleUpdateSchema>;
type ParseAutomationRulePayload = z.input<typeof automationRuleParseSchema>;

const aiKeys = {
  providers: ['ai-providers'] as const,
  providerDetail: (id: string) => ['ai-providers', id] as const,
  predictions: (ticketId: string) => ['ai-predictions', ticketId] as const,
  analysis: (ticketId: string) => ['ai-analysis', ticketId] as const,
  automationRules: ['automation-rules'] as const,
  automationRuleDetail: (id: string) => ['automation-rules', id] as const,
};

export function useAIProviders() {
  return useQuery({
    queryKey: aiKeys.providers,
    queryFn: () => fetchApi<AIProviderConfigItem[]>('/api/ai/providers'),
  });
}

export function useAIProvider(id: string) {
  return useQuery({
    queryKey: aiKeys.providerDetail(id),
    queryFn: () => fetchApi<AIProviderConfigItem>(`/api/ai/providers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAIProviderPayload) =>
      fetchApi<AIProviderConfigItem>('/api/ai/providers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.providers });
      toast.success('AI provider saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAIProviderPayload;
    }) =>
      fetchApi<AIProviderConfigItem>(`/api/ai/providers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.providers });
      queryClient.invalidateQueries({
        queryKey: aiKeys.providerDetail(variables.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/ai/providers/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.providers });
      toast.success('AI provider deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRunPrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PredictionRequestPayload) =>
      fetchApi<PredictionResult>('/api/ai/predict', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiKeys.predictions(variables.ticketId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAcceptPrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ticketId,
      accepted,
    }: {
      id: string;
      ticketId: string;
      accepted: PredictionAcceptancePayload['accepted'];
    }) =>
      fetchApi<{ prediction: AIPredictionItem; applied: boolean }>(
        `/api/ai/predict/${id}/accept`,
        {
          method: 'POST',
          body: JSON.stringify({ accepted }),
        }
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiKeys.predictions(variables.ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: aiKeys.analysis(variables.ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: ticketKeys.detail(variables.ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: ticketKeys.history(variables.ticketId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAnalyzeTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AnalyzeTicketPayload) =>
      fetchApi<TicketAnalysis>('/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiKeys.analysis(variables.ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: aiKeys.predictions(variables.ticketId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAutomationRules(isActive?: boolean) {
  return useQuery({
    queryKey:
      isActive === undefined
        ? aiKeys.automationRules
        : [...aiKeys.automationRules, { isActive }] as const,
    queryFn: () =>
      fetchApi<AutomationRuleItem[]>(
        `/api/ai/automation-rules${buildQueryString({
          isActive: isActive === undefined ? undefined : String(isActive),
        })}`
      ),
  });
}

export function useAutomationRule(id: string) {
  return useQuery({
    queryKey: aiKeys.automationRuleDetail(id),
    queryFn: () =>
      fetchApi<AutomationRuleDetail>(`/api/ai/automation-rules/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAutomationRulePayload) =>
      fetchApi<AutomationRuleItem>('/api/ai/automation-rules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.automationRules });
      toast.success('Automation rule created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAutomationRulePayload;
    }) =>
      fetchApi<AutomationRuleDetail>(`/api/ai/automation-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.automationRules });
      queryClient.invalidateQueries({
        queryKey: aiKeys.automationRuleDetail(variables.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/ai/automation-rules/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.automationRules });
      toast.success('Automation rule deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useParseAutomationRule() {
  return useMutation({
    mutationFn: (data: ParseAutomationRulePayload) =>
      fetchApi<ParsedRuleResult>('/api/ai/automation-rules/parse', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export { aiKeys };
