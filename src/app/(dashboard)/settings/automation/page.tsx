'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useAutomationRule,
  useAutomationRules,
  useCreateAutomationRule,
  useDeleteAutomationRule,
  useParseAutomationRule,
  useUpdateAutomationRule,
} from '@/hooks/use-ai';
import {
  automationRuleCreateSchema,
  automationRuleUpdateSchema,
} from '@/lib/validators/ai';
import type {
  AutomationRuleDetail,
  AutomationRuleItem,
  ParsedRuleResult,
} from '@/types/ai';

type CreateAutomationRuleValues = z.input<typeof automationRuleCreateSchema>;
type UpdateAutomationRuleValues = z.input<typeof automationRuleUpdateSchema>;

function DeleteRuleDialog({
  open,
  onOpenChange,
  rule,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: AutomationRuleItem | null;
  onConfirm: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete automation rule</DialogTitle>
          <DialogDescription>
            {rule
              ? `Are you sure you want to delete "${rule.name}"?`
              : 'Are you sure you want to delete this rule?'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (rule) {
                onConfirm(rule.id);
              }
            }}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AutomationRuleDialog({
  open,
  onOpenChange,
  rule,
  detail,
  detailLoading,
  isSubmitting,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: AutomationRuleItem | null;
  detail: AutomationRuleDetail | undefined;
  detailLoading: boolean;
  isSubmitting: boolean;
  onCreate: (data: CreateAutomationRuleValues) => Promise<unknown>;
  onUpdate: (id: string, data: UpdateAutomationRuleValues) => Promise<unknown>;
}) {
  const [parsedPreview, setParsedPreview] = useState<ParsedRuleResult | null>(null);
  const parseRule = useParseAutomationRule();
  const isEditing = Boolean(rule);

  const form = useForm<CreateAutomationRuleValues | UpdateAutomationRuleValues>({
    resolver: zodResolver(
      isEditing ? automationRuleUpdateSchema : automationRuleCreateSchema
    ),
    defaultValues: {
      name: rule?.name ?? '',
      description: rule?.description ?? '',
      naturalLanguageRule: rule?.naturalLanguageRule ?? '',
      isActive: rule?.isActive ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      name: detail?.name ?? rule?.name ?? '',
      description: detail?.description ?? rule?.description ?? '',
      naturalLanguageRule:
        detail?.naturalLanguageRule ?? rule?.naturalLanguageRule ?? '',
      isActive: detail?.isActive ?? rule?.isActive ?? true,
    });
    setParsedPreview(null);
  }, [detail, form, open, rule]);

  async function handlePreviewParse() {
    const isValid = await form.trigger('naturalLanguageRule');

    if (!isValid) {
      return;
    }

    const naturalLanguageRule = form.getValues('naturalLanguageRule');

    const result = await parseRule.mutateAsync({
      naturalLanguageRule: String(naturalLanguageRule),
    });

    setParsedPreview(result);
  }

  async function handleSubmit() {
    await form.handleSubmit(async (values) => {
      if (rule) {
        await onUpdate(rule.id, values as UpdateAutomationRuleValues);
      } else {
        await onCreate(values as CreateAutomationRuleValues);
      }

      onOpenChange(false);
    })();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Automation Rule' : 'New Automation Rule'}
          </DialogTitle>
          <DialogDescription>
            Describe the rule in natural language and preview how the AI compiler interprets it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name">Name</Label>
              <Input id="rule-name" {...form.register('name')} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex h-10 items-center gap-3 rounded-md border px-3">
                <Switch
                  checked={Boolean(form.watch('isActive') ?? true)}
                  onCheckedChange={(checked) =>
                    form.setValue('isActive', checked, {
                      shouldValidate: true,
                    })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {form.watch('isActive') === false ? 'Inactive' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rule-description">Description</Label>
            <Textarea
              id="rule-description"
              rows={2}
              placeholder="Optional context for your team"
              {...form.register('description')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rule-natural-language">Natural Language Rule</Label>
            <Textarea
              id="rule-natural-language"
              rows={5}
              placeholder="When a Critical ticket is open for more than 1 hour, escalate to the team manager"
              {...form.register('naturalLanguageRule')}
            />
            <p className="rounded-lg border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-xs italic text-muted-foreground">
              “{form.watch('naturalLanguageRule') || 'Your rule will appear here for preview.'}”
            </p>
          </div>

          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handlePreviewParse()}
              disabled={parseRule.isPending}
            >
              {parseRule.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Preview Parse
            </Button>
          </div>

          {parsedPreview ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Parsed Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Trigger</span>
                  <Badge variant="secondary">{parsedPreview.triggerType}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Conditions
                    </p>
                    <div className="space-y-2">
                      {parsedPreview.compiledRule.conditions.length > 0 ? (
                        parsedPreview.compiledRule.conditions.map((condition, index) => (
                          <div key={`${condition.field}-${index}`} className="rounded-md border p-2 text-xs">
                            <p className="font-medium">{condition.field}</p>
                            <p className="text-muted-foreground">
                              {condition.operator} {JSON.stringify(condition.value)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No conditions detected.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Actions
                    </p>
                    <div className="space-y-2">
                      {parsedPreview.compiledRule.actions.length > 0 ? (
                        parsedPreview.compiledRule.actions.map((action, index) => (
                          <div key={`${action.type}-${index}`} className="rounded-md border p-2 text-xs">
                            <p className="font-medium">{action.type}</p>
                            <p className="text-muted-foreground">
                              {JSON.stringify(action.params)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No actions detected.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {rule ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recent Executions</CardTitle>
              </CardHeader>
              <CardContent>
                {detailLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : detail?.executions && detail.executions.length > 0 ? (
                  <div className="space-y-2">
                    {detail.executions.map((execution) => (
                      <div
                        key={execution.id}
                        className="flex items-center justify-between rounded-md border p-2 text-xs"
                      >
                        <div>
                          <p className="font-medium">{execution.status}</p>
                          <p className="text-muted-foreground">
                            {execution.ticketId ? `Ticket ${execution.ticketId}` : 'No ticket'}
                          </p>
                        </div>
                        <p className="text-muted-foreground">
                          {format(new Date(execution.executedAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No execution history is available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {rule ? 'Save Changes' : 'Save Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AutomationSettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRuleItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AutomationRuleItem | null>(null);
  const rulesQuery = useAutomationRules();
  const createRule = useCreateAutomationRule();
  const updateRule = useUpdateAutomationRule();
  const deleteRule = useDeleteAutomationRule();
  const detailQuery = useAutomationRule(editingRule?.id ?? '');

  const isSubmitting = createRule.isPending || updateRule.isPending;

  if (rulesQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground mt-1">
          {rulesQuery.error?.message ?? 'An unexpected error occurred'}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => rulesQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  function openCreateDialog() {
    setEditingRule(null);
    setDialogOpen(true);
  }

  function openEditDialog(rule: AutomationRuleItem) {
    setEditingRule(rule);
    setDialogOpen(true);
  }

  const emptyState = useMemo(
    () => !rulesQuery.isLoading && (rulesQuery.data?.length ?? 0) === 0,
    [rulesQuery.data, rulesQuery.isLoading]
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground">
            Settings
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Automation Rules</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Automation Rules</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create natural-language automations for routing, escalation, and status changes.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Rule
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {rulesQuery.isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : emptyState ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium">No automation rules yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start with a natural-language rule and preview the compiled trigger, conditions, and actions.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Natural Language Rule</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executions</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rulesQuery.data ?? []).map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                          <Zap className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{rule.name}</p>
                          {rule.description ? (
                            <p className="text-xs text-muted-foreground">{rule.description}</p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2 text-xs italic text-muted-foreground">
                        “{rule.naturalLanguageRule}”
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {rule.triggerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) =>
                            updateRule.mutate({
                              id: rule.id,
                              data: { isActive: checked },
                            })
                          }
                          disabled={updateRule.isPending}
                        />
                        <span className="text-xs text-muted-foreground">
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rule._count.executions}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(rule)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setRuleToDelete(rule);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AutomationRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
        detail={detailQuery.data}
        detailLoading={detailQuery.isLoading}
        isSubmitting={isSubmitting}
        onCreate={(data) => createRule.mutateAsync(data)}
        onUpdate={(id, data) => updateRule.mutateAsync({ id, data })}
      />

      <DeleteRuleDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        rule={ruleToDelete}
        isDeleting={deleteRule.isPending}
        onConfirm={(id) => {
          deleteRule.mutate(id, {
            onSuccess: () => {
              setDeleteDialogOpen(false);
              setRuleToDelete(null);
            },
          });
        }}
      />
    </div>
  );
}
