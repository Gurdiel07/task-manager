'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useSLAPolicies,
  useCreateSLAPolicy,
  useUpdateSLAPolicy,
  useDeleteSLAPolicy,
} from '@/hooks/use-sla';
import { createSLAPolicySchema } from '@/lib/validators/sla';
import type { SLAPolicyItem } from '@/types/sla';

type FormValues = z.input<typeof createSLAPolicySchema>;

function formatMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function conditionsSummary(conditions: Record<string, unknown>) {
  const parts: string[] = [];
  if (conditions.priority) parts.push(`Priority: ${conditions.priority}`);
  if (conditions.category) parts.push(`Category: ${conditions.category}`);
  if (conditions.teamId) parts.push(`Team: ${String(conditions.teamId).slice(0, 6)}…`);
  return parts.length > 0 ? parts.join(', ') : 'All tickets';
}

function PolicyFormDialog({
  open,
  onOpenChange,
  policy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: SLAPolicyItem;
}) {
  const createMutation = useCreateSLAPolicy();
  const updateMutation = useUpdateSLAPolicy();
  const isEditing = Boolean(policy);

  const form = useForm<FormValues>({
    resolver: zodResolver(createSLAPolicySchema),
    defaultValues: {
      name: policy?.name ?? '',
      description: policy?.description ?? '',
      responseTimeMin: policy?.responseTimeMin ?? 60,
      resolutionMin: policy?.resolutionMin ?? 480,
      conditions: policy?.conditions ?? undefined,
      isActive: policy?.isActive ?? true,
    },
  });

  function onSubmit(values: FormValues) {
    if (isEditing && policy) {
      updateMutation.mutate(
        { id: policy.id, data: values },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit SLA Policy' : 'New SLA Policy'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Critical Priority SLA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description..."
                      rows={2}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responseTimeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Response Time (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resolutionMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Time (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormLabel>Conditions (optional)</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <Input
                    placeholder="e.g. CRITICAL"
                    defaultValue={String(policy?.conditions?.priority ?? '')}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      const current = form.getValues('conditions') as Record<string, unknown>;
                      if (val) {
                        form.setValue('conditions', { ...current, priority: val });
                      } else {
                        const { priority: _p, ...rest } = current;
                        form.setValue('conditions', rest);
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Input
                    placeholder="e.g. Bug"
                    defaultValue={String(policy?.conditions?.category ?? '')}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      const current = form.getValues('conditions') as Record<string, unknown>;
                      if (val) {
                        form.setValue('conditions', { ...current, category: val });
                      } else {
                        const { category: _c, ...rest } = current;
                        form.setValue('conditions', rest);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Policy'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SLASettingsPage() {
  const slaPoliciesQuery = useSLAPolicies();
  const { data: policies, isLoading } = slaPoliciesQuery;
  const updateMutation = useUpdateSLAPolicy();
  const deleteMutation = useDeleteSLAPolicy();

  const [createOpen, setCreateOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<SLAPolicyItem | null>(null);
  const [deletePolicy, setDeletePolicy] = useState<SLAPolicyItem | null>(null);

  if (slaPoliciesQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground mt-1">
          {slaPoliciesQuery.error?.message ?? 'An unexpected error occurred'}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => slaPoliciesQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Link href="/settings" className="hover:text-foreground">Settings</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">SLA Policies</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SLA Policies</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Define response and resolution time targets by ticket priority
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Name</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Resolution Time</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Breaches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : policies?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No SLA policies yet. Create your first policy.
                  </TableCell>
                </TableRow>
              ) : (
                policies?.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{policy.name}</p>
                      {policy.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {policy.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {formatMinutes(policy.responseTimeMin)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {formatMinutes(policy.resolutionMin)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {conditionsSummary(policy.conditions)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {policy._count.breaches}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={policy.isActive}
                          disabled={updateMutation.isPending}
                          onCheckedChange={(checked) =>
                            updateMutation.mutate({
                              id: policy.id,
                              data: { isActive: checked },
                            })
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditPolicy(policy)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeletePolicy(policy)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PolicyFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editPolicy && (
        <PolicyFormDialog
          open={Boolean(editPolicy)}
          onOpenChange={(open) => !open && setEditPolicy(null)}
          policy={editPolicy}
        />
      )}

      <AlertDialog
        open={Boolean(deletePolicy)}
        onOpenChange={(open) => !open && setDeletePolicy(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SLA Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletePolicy?.name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletePolicy) {
                  deleteMutation.mutate(deletePolicy.id, {
                    onSuccess: () => setDeletePolicy(null),
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
