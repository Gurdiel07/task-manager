'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ChevronRight,
  ArrowRight,
  Play,
  Pencil,
  Loader2,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useWorkflow, useWorkflowInstances } from '@/hooks/use-workflows';
import { stepTypeConfig } from '@/components/workflows/step-node';
import type { InstanceStatus } from '@/generated/prisma/client';

const instanceStatusColors: Record<InstanceStatus, string> = {
  ACTIVE:
    'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
  PAUSED:
    'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900',
  COMPLETED:
    'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  CANCELLED:
    'border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  FAILED:
    'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900',
};

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: workflow, isLoading: loadingTemplate } = useWorkflow(id);
  const { data: instances, isLoading: loadingInstances } =
    useWorkflowInstances(id);

  if (loadingTemplate) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Workflow not found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This workflow may have been deleted.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/workflows">Back to Workflows</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Link href="/workflows" className="hover:text-foreground">
            Workflows
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{workflow.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {workflow.name}
              </h1>
              <Badge
                variant="outline"
                className={
                  workflow.isActive
                    ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900'
                    : 'border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                }
              >
                {workflow.isActive ? (
                  <Play className="h-2.5 w-2.5 mr-1" />
                ) : null}
                {workflow.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {workflow.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workflows/builder?templateId=${workflow.id}`}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit in Builder
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Workflow steps preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Workflow Steps ({workflow.steps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflow.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No steps defined yet.{' '}
              <Link
                href={`/workflows/builder?templateId=${workflow.id}`}
                className="text-primary hover:underline"
              >
                Open the builder
              </Link>{' '}
              to add steps.
            </p>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {workflow.steps.map((step, i) => {
                const typeConf = stepTypeConfig[step.type];
                const TypeIcon = typeConf.icon;

                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm">
                        <div
                          className={`flex items-center justify-center w-5 h-5 rounded ${typeConf.bgColor}`}
                          style={{ color: typeConf.color }}
                        >
                          <TypeIcon className="h-3 w-3" />
                        </div>
                        <span className="font-medium">{step.name}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0"
                          style={{
                            borderColor: typeConf.color,
                            color: typeConf.color,
                          }}
                        >
                          {typeConf.label}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Step {i + 1}
                      </span>
                    </div>
                    {i < workflow.steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instances */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Instances
            {instances && instances.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {instances.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingInstances ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !instances || instances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No workflow instances yet
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {instance.ticket.title}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          #{instance.ticket.number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {instance.currentStep?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={instanceStatusColors[instance.status]}
                      >
                        {instance.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(
                        new Date(instance.startedAt),
                        'MMM d, yyyy'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
