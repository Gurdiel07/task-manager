'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Bot,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAIProviders,
  useCreateAIProvider,
  useDeleteAIProvider,
  useUpdateAIProvider,
} from '@/hooks/use-ai';
import {
  createAIProviderConfigSchema,
  updateAIProviderConfigSchema,
} from '@/lib/validators/ai';
import type { AIProviderConfigItem } from '@/types/ai';

type CreateProviderFormValues = z.input<typeof createAIProviderConfigSchema>;
type UpdateProviderFormValues = z.input<typeof updateAIProviderConfigSchema>;

const providerSuggestions: Record<'OPENAI' | 'ANTHROPIC', string[]> = {
  OPENAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'],
  ANTHROPIC: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
};

function AIProviderDialog({
  open,
  onOpenChange,
  provider,
  isSubmitting,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: AIProviderConfigItem | null;
  isSubmitting: boolean;
  onCreate: (data: CreateProviderFormValues) => Promise<unknown>;
  onUpdate: (id: string, data: UpdateProviderFormValues) => Promise<unknown>;
}) {
  const isEditing = Boolean(provider);
  const resolver = zodResolver(
    isEditing ? updateAIProviderConfigSchema : createAIProviderConfigSchema
  );

  const form = useForm<CreateProviderFormValues | UpdateProviderFormValues>({
    resolver,
    defaultValues: {
      provider: provider?.provider ?? 'OPENAI',
      model: provider?.model ?? 'gpt-4o',
      apiKey: undefined,
      isDefault: provider?.isDefault ?? false,
      settings: {
        temperature:
          (provider?.settings?.temperature as number | undefined) ?? 0.3,
        maxTokens: (provider?.settings?.maxTokens as number | undefined) ?? 2048,
      },
    },
  });

  useEffect(() => {
    form.reset({
      provider: provider?.provider ?? 'OPENAI',
      model:
        provider?.model ??
        providerSuggestions[provider?.provider ?? 'OPENAI'][0] ??
        'gpt-4o',
      apiKey: undefined,
      isDefault: provider?.isDefault ?? false,
      settings: {
        temperature:
          (provider?.settings?.temperature as number | undefined) ?? 0.3,
        maxTokens: (provider?.settings?.maxTokens as number | undefined) ?? 2048,
      },
      test: undefined,
    });
  }, [form, provider, open]);

  const selectedProvider =
    (form.watch('provider') as 'OPENAI' | 'ANTHROPIC' | undefined) ?? 'OPENAI';
  const temperature = Number(form.watch('settings.temperature') ?? 0.3);

  async function submit(mode: 'save' | 'test') {
    await form.handleSubmit(async (values) => {
      const payload = {
        ...values,
        apiKey: values.apiKey,
        settings: {
          temperature:
            values.settings?.temperature !== undefined
              ? Number(values.settings.temperature)
              : undefined,
          maxTokens:
            values.settings?.maxTokens !== undefined
              ? Number(values.settings.maxTokens)
              : undefined,
        },
        test: mode === 'test',
      };

      if (provider) {
        await onUpdate(provider.id, payload as UpdateProviderFormValues);
      } else {
        await onCreate(payload as CreateProviderFormValues);
      }

      onOpenChange(false);
    })();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {provider ? 'Edit AI Provider' : 'Add AI Provider'}
          </DialogTitle>
          <DialogDescription>
            Configure the provider, model, and runtime settings used for AI predictions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select
                value={selectedProvider}
                onValueChange={(value) =>
                  form.setValue(
                    'provider',
                    value as CreateProviderFormValues['provider'],
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPENAI">OpenAI</SelectItem>
                  <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="gpt-4o"
                {...form.register('model')}
              />
              <p className="text-xs text-muted-foreground">
                Suggested:{' '}
                {providerSuggestions[selectedProvider].join(', ')}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={
                provider ? 'Leave blank to keep the current key' : 'Paste provider API key'
              }
              {...form.register('apiKey', {
                setValueAs: (value) => {
                  const nextValue = String(value ?? '').trim();
                  return nextValue ? nextValue : undefined;
                },
              })}
            />
            {provider ? (
              <p className="text-xs text-muted-foreground">
                Current key: {provider.maskedApiKey}
              </p>
            ) : null}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm font-mono text-muted-foreground">
                {temperature.toFixed(1)}
              </span>
            </div>
            <input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(event) =>
                form.setValue(
                  'settings.temperature',
                  Number(event.target.value),
                  { shouldValidate: true }
                )
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Deterministic</span>
              <span>Creative</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min="1"
              step="1"
              {...form.register('settings.maxTokens', {
                setValueAs: (value) => {
                  const nextValue = String(value ?? '').trim();
                  return nextValue ? Number(nextValue) : undefined;
                },
              })}
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border p-3">
            <Checkbox
              id="isDefault"
              checked={Boolean(form.watch('isDefault'))}
              onCheckedChange={(checked) =>
                form.setValue('isDefault', Boolean(checked), {
                  shouldValidate: true,
                })
              }
            />
            <div>
              <Label htmlFor="isDefault">Set as default provider</Label>
              <p className="text-xs text-muted-foreground">
                The default provider is used by AI predictions unless another config is selected.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => void submit('test')}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Connection
          </Button>
          <Button type="button" onClick={() => void submit('save')} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {provider ? 'Save Changes' : 'Save Provider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AISettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProviderConfigItem | null>(
    null
  );
  const providersQuery = useAIProviders();
  const createProvider = useCreateAIProvider();
  const updateProvider = useUpdateAIProvider();
  const deleteProvider = useDeleteAIProvider();

  const defaultProvider = useMemo(
    () => providersQuery.data?.find((provider) => provider.isDefault) ?? null,
    [providersQuery.data]
  );

  const isSubmitting = createProvider.isPending || updateProvider.isPending;

  function openCreateDialog() {
    setEditingProvider(null);
    setDialogOpen(true);
  }

  function openEditDialog(provider: AIProviderConfigItem) {
    setEditingProvider(provider);
    setDialogOpen(true);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground">
            Settings
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">AI Configuration</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Configuration</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure the provider and model used for intelligent ticket analysis.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Default Provider</CardTitle>
        </CardHeader>
        <CardContent>
          {providersQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
            </div>
          ) : defaultProvider ? (
            <div className="flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {defaultProvider.provider} · {defaultProvider.model}
                </p>
                <p className="text-xs text-muted-foreground">
                  {defaultProvider.maskedApiKey} · Active default provider
                </p>
              </div>
              <Badge className="w-fit" variant="outline">
                Default
              </Badge>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm font-medium">No AI provider configured yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a provider to enable intelligent routing, prioritization, and automation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configured Providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {providersQuery.isLoading ? (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : providersQuery.data && providersQuery.data.length > 0 ? (
            providersQuery.data.map((provider) => (
              <div
                key={provider.id}
                className="rounded-lg border p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                          {provider.provider}
                        </p>
                        <Badge variant="secondary">{provider.model}</Badge>
                        {provider.isDefault ? (
                          <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                            Default
                          </Badge>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>API Key: {provider.maskedApiKey}</p>
                        <p>
                          Temperature:{' '}
                          {String(provider.settings?.temperature ?? 0.3)} · Max tokens:{' '}
                          {String(provider.settings?.maxTokens ?? 2048)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!provider.isDefault ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateProvider.mutate({
                            id: provider.id,
                            data: { isDefault: true },
                          })
                        }
                        disabled={updateProvider.isPending}
                      >
                        Set Default
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(provider)}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (window.confirm('Delete this AI provider configuration?')) {
                          deleteProvider.mutate(provider.id);
                        }
                      }}
                      disabled={deleteProvider.isPending}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm font-medium">No providers saved</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add OpenAI or Anthropic credentials to turn on the AI core.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AIProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        provider={editingProvider}
        isSubmitting={isSubmitting}
        onCreate={(data) => createProvider.mutateAsync(data)}
        onUpdate={(id, data) => updateProvider.mutateAsync({ id, data })}
      />
    </div>
  );
}
