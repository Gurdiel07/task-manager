'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle,
  SkipForward,
  XCircle,
  UserPlus,
  Camera,
  RotateCcw,
  Pause,
  Play,
  Ban,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { stepTypeConfig } from './step-node';
import {
  useWorkflowInstance,
  useUpdateWorkflowInstance,
  useUpdateStepInstance,
  useCreateSnapshot,
  useWorkflowSnapshots,
  useRestoreSnapshot,
} from '@/hooks/use-workflows';
import type { StepStatus, InstanceStatus } from '@/generated/prisma/client';

interface WorkflowInstancePanelProps {
  instanceId: string;
}

const stepStatusConfig: Record<
  StepStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  PENDING: {
    label: 'Pending',
    variant: 'outline',
    className: 'border-muted-foreground/30 text-muted-foreground',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    variant: 'default',
    className: 'bg-blue-500 hover:bg-blue-500',
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-500',
  },
  SKIPPED: {
    label: 'Skipped',
    variant: 'secondary',
    className: '',
  },
  FAILED: {
    label: 'Failed',
    variant: 'destructive',
    className: '',
  },
};

const instanceStatusConfig: Record<
  InstanceStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: 'Active',
    className:
      'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
  },
  PAUSED: {
    label: 'Paused',
    className:
      'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900',
  },
  COMPLETED: {
    label: 'Completed',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  },
  CANCELLED: {
    label: 'Cancelled',
    className:
      'border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  },
  FAILED: {
    label: 'Failed',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900',
  },
};

export function WorkflowInstancePanel({
  instanceId,
}: WorkflowInstancePanelProps) {
  const { data: instance, isLoading } = useWorkflowInstance(instanceId);
  const updateInstance = useUpdateWorkflowInstance(instanceId);
  const updateStep = useUpdateStepInstance(instanceId);
  const createSnapshotMut = useCreateSnapshot(instanceId);
  const { data: snapshots } = useWorkflowSnapshots(instanceId);
  const restoreSnapshotMut = useRestoreSnapshot(instanceId);

  const [failReason, setFailReason] = useState('');
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [failStepId, setFailStepId] = useState<string | null>(null);
  const [snapshotNote, setSnapshotNote] = useState('');
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);

  if (isLoading || !instance) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusConf = instanceStatusConfig[instance.status];
  const isActive = instance.status === 'ACTIVE';
  const isPaused = instance.status === 'PAUSED';

  return (
    <div className="space-y-6">
      {/* Instance header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {instance.template.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Ticket #{instance.ticket.number} &mdash; {instance.ticket.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusConf.className}>
            {statusConf.label}
          </Badge>
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateInstance.mutate({ action: 'pause' })}
            >
              <Pause className="h-3.5 w-3.5 mr-1" />
              Pause
            </Button>
          )}
          {isPaused && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateInstance.mutate({ action: 'resume' })}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Resume
            </Button>
          )}
          {(isActive || isPaused) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateInstance.mutate({ action: 'cancel' })}
            >
              <Ban className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Step flow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {instance.steps.map((instStep) => {
            const typeConf = stepTypeConfig[instStep.step.type];
            const stConf = stepStatusConfig[instStep.status];
            const isCurrentStep = instStep.stepId === instance.currentStepId;
            const canAct =
              isActive && instStep.status === 'IN_PROGRESS';

            return (
              <div
                key={instStep.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isCurrentStep
                    ? 'border-primary bg-primary/5'
                    : instStep.status === 'COMPLETED'
                    ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900/50'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-md ${typeConf.bgColor}`}
                      style={{ color: typeConf.color }}
                    >
                      <typeConf.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {instStep.step.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={stConf.variant}
                          className={`text-[10px] px-1.5 py-0 ${stConf.className}`}
                        >
                          {stConf.label}
                        </Badge>
                        {instStep.assignedTo && (
                          <span className="text-[11px] text-muted-foreground">
                            {instStep.assignedTo.name ?? instStep.assignedTo.email}
                          </span>
                        )}
                        {instStep.completedAt && (
                          <span className="text-[11px] text-muted-foreground">
                            {format(
                              new Date(instStep.completedAt),
                              'MMM d, HH:mm'
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canAct && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateStep.mutate({
                            stepId: instStep.stepId,
                            data: { action: 'complete' },
                          })
                        }
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateStep.mutate({
                            stepId: instStep.stepId,
                            data: { action: 'skip' },
                          })
                        }
                      >
                        <SkipForward className="h-3 w-3 mr-1" />
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => {
                          setFailStepId(instStep.stepId);
                          setFailDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Fail
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateStep.mutate({
                            stepId: instStep.stepId,
                            data: {
                              action: 'assign',
                              assignedToId: 'self',
                            },
                          })
                        }
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Snapshots */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Snapshots</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSnapshotDialogOpen(true)}
            >
              <Camera className="h-3.5 w-3.5 mr-1" />
              Create Snapshot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!snapshots || snapshots.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No snapshots yet
            </p>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex items-center justify-between rounded-lg border p-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {snap.note || 'Snapshot'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(snap.createdAt), 'MMM d, yyyy HH:mm')}{' '}
                      by {snap.createdBy.name ?? snap.createdBy.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => restoreSnapshotMut.mutate(snap.id)}
                    disabled={restoreSnapshotMut.isPending}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fail step dialog */}
      <Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fail Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                placeholder="Why is this step failing?"
              />
            </div>
            <Button
              className="w-full"
              variant="destructive"
              disabled={!failReason.trim()}
              onClick={() => {
                if (failStepId) {
                  updateStep.mutate({
                    stepId: failStepId,
                    data: {
                      action: 'fail',
                      data: { reason: failReason },
                    },
                  });
                }
                setFailDialogOpen(false);
                setFailReason('');
                setFailStepId(null);
              }}
            >
              Confirm Failure
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Snapshot dialog */}
      <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Snapshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                value={snapshotNote}
                onChange={(e) => setSnapshotNote(e.target.value)}
                placeholder="Describe this snapshot"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                createSnapshotMut.mutate({
                  note: snapshotNote || undefined,
                });
                setSnapshotDialogOpen(false);
                setSnapshotNote('');
              }}
            >
              Create Snapshot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
