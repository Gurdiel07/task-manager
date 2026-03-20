'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  MousePointer2,
  Zap,
  CheckCircle,
  GitBranch,
  Bell,
  GripVertical,
  Save,
  Settings,
  Link2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StepNode, STEP_WIDTH, stepTypeConfig } from './step-node';
import { TransitionLine, TransitionDefs } from './transition-line';
import { StepEditor } from './step-editor';
import {
  useWorkflow,
  useUpdateWorkflow,
  useCreateStep,
  useUpdateSteps,
  useDeleteStep,
  useCreateTransition,
  useDeleteTransition,
} from '@/hooks/use-workflows';
import { fetchApi } from '@/hooks/api-client';
import type { WorkflowStepType } from '@/generated/prisma/client';
import type {
  WorkflowStepItem,
  WorkflowTransitionItem,
  WorkflowTemplateListItem,
} from '@/types/workflows';

interface WorkflowBuilderProps {
  templateId: string | null;
}

type LocalStep = WorkflowStepItem & { isLocal?: boolean };
type LocalTransition = WorkflowTransitionItem & { isLocal?: boolean };

const STEP_TYPES: {
  type: WorkflowStepType;
  label: string;
  description: string;
  icon: typeof MousePointer2;
  color: string;
}[] = [
  {
    type: 'MANUAL',
    label: 'Manual Step',
    description: 'Human action required',
    icon: MousePointer2,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    type: 'AUTOMATIC',
    label: 'Automatic',
    description: 'System executes automatically',
    icon: Zap,
    color:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    type: 'APPROVAL',
    label: 'Approval',
    description: 'Requires manager sign-off',
    icon: CheckCircle,
    color:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    type: 'CONDITION',
    label: 'Condition',
    description: 'Branches based on logic',
    icon: GitBranch,
    color:
      'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    type: 'NOTIFICATION',
    label: 'Notification',
    description: 'Send email or alert',
    icon: Bell,
    color:
      'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
];

export function WorkflowBuilder({ templateId }: WorkflowBuilderProps) {
  const router = useRouter();

  const [templateName, setTemplateName] = useState('New Workflow');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [steps, setSteps] = useState<LocalStep[]>([]);
  const [transitions, setTransitions] = useState<LocalTransition[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<LocalStep | null>(null);
  const [saving, setSaving] = useState(false);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTemplateId = templateId;

  const { data: templateData, isLoading } = useWorkflow(activeTemplateId ?? '');
  const updateTemplateMut = useUpdateWorkflow();
  const createStepMut = useCreateStep(activeTemplateId ?? '');
  const updateStepsMut = useUpdateSteps(activeTemplateId ?? '');
  const deleteStepMut = useDeleteStep(activeTemplateId ?? '');
  const createTransitionMut = useCreateTransition(activeTemplateId ?? '');
  const deleteTransitionMut = useDeleteTransition(activeTemplateId ?? '');

  useEffect(() => {
    if (templateData) {
      setTemplateName(templateData.name);
      setTemplateDescription(templateData.description ?? '');
      setTemplateCategory(templateData.category ?? '');
      setSteps(templateData.steps);
      setTransitions(templateData.transitions);
    }
  }, [templateData]);

  useEffect(() => {
    if (!templateId) setSettingsOpen(true);
  }, [templateId]);

  const handleAddStep = useCallback(
    async (type: WorkflowStepType) => {
      const newOrder = steps.length;
      const positionX = 100 + (newOrder % 3) * 260;
      const positionY = 60 + Math.floor(newOrder / 3) * 150;

      if (activeTemplateId) {
        try {
          const step = await createStepMut.mutateAsync({
            name: `${stepTypeConfig[type].label} ${newOrder + 1}`,
            type,
            order: newOrder,
            positionX,
            positionY,
          });
          setSteps((prev) => [...prev, step]);
        } catch {
          /* hook shows toast */
        }
      } else {
        const localStep: LocalStep = {
          id: crypto.randomUUID(),
          templateId: '',
          name: `${stepTypeConfig[type].label} ${newOrder + 1}`,
          description: null,
          type,
          order: newOrder,
          config: null,
          positionX,
          positionY,
          isLocal: true,
        };
        setSteps((prev) => [...prev, localStep]);
      }
    },
    [steps.length, activeTemplateId, createStepMut]
  );

  const handleDeleteStep = useCallback(
    async (stepId: string) => {
      const step = steps.find((s) => s.id === stepId);
      if (!step) return;

      if (activeTemplateId && !step.isLocal) {
        try {
          await deleteStepMut.mutateAsync(stepId);
        } catch {
          return;
        }
      }

      setSteps((prev) => prev.filter((s) => s.id !== stepId));
      setTransitions((prev) =>
        prev.filter((t) => t.fromStepId !== stepId && t.toStepId !== stepId)
      );
      if (selectedStepId === stepId) setSelectedStepId(null);
    },
    [steps, activeTemplateId, deleteStepMut, selectedStepId]
  );

  const handleConnect = useCallback(
    async (toStepId: string) => {
      if (!connectingFrom || connectingFrom === toStepId) {
        setConnectingFrom(null);
        return;
      }

      const exists = transitions.some(
        (t) => t.fromStepId === connectingFrom && t.toStepId === toStepId
      );
      if (exists) {
        setConnectingFrom(null);
        toast.error('Transition already exists');
        return;
      }

      if (activeTemplateId) {
        try {
          const transition = await createTransitionMut.mutateAsync({
            fromStepId: connectingFrom,
            toStepId,
          });
          setTransitions((prev) => [...prev, transition]);
        } catch {
          /* hook shows toast */
        }
      } else {
        setTransitions((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            templateId: '',
            fromStepId: connectingFrom,
            toStepId,
            label: null,
            condition: null,
            isLocal: true,
          },
        ]);
      }

      setConnectingFrom(null);
    },
    [connectingFrom, transitions, activeTemplateId, createTransitionMut]
  );

  const handleDeleteTransition = useCallback(
    async (transitionId: string) => {
      const transition = transitions.find((t) => t.id === transitionId);
      if (!transition) return;

      if (activeTemplateId && !transition.isLocal) {
        try {
          await deleteTransitionMut.mutateAsync(transitionId);
        } catch {
          return;
        }
      }

      setTransitions((prev) => prev.filter((t) => t.id !== transitionId));
      if (selectedTransitionId === transitionId) setSelectedTransitionId(null);
    },
    [transitions, activeTemplateId, deleteTransitionMut, selectedTransitionId]
  );

  const handleStepPointerDown = useCallback(
    (stepId: string, e: React.PointerEvent) => {
      e.preventDefault();
      const step = stepsRef.current.find((s) => s.id === stepId);
      if (!step) return;

      const drag = {
        stepId,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPosX: step.positionX,
        startPosY: step.positionY,
      };

      const handleMove = (mv: PointerEvent) => {
        const dx = mv.clientX - drag.startMouseX;
        const dy = mv.clientY - drag.startMouseY;
        const newX = Math.max(0, drag.startPosX + dx);
        const newY = Math.max(0, drag.startPosY + dy);
        setSteps((prev) =>
          prev.map((s) =>
            s.id === stepId ? { ...s, positionX: newX, positionY: newY } : s
          )
        );
      };

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);

        if (!activeTemplateId) return;

        const latest = stepsRef.current.find((s) => s.id === stepId);
        if (!latest || latest.isLocal) return;

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          const current = stepsRef.current.find((s) => s.id === stepId);
          if (current && !current.isLocal) {
            updateStepsMut.mutate([
              {
                id: current.id,
                positionX: current.positionX,
                positionY: current.positionY,
              },
            ]);
          }
        }, 400);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [activeTemplateId, updateStepsMut]
  );

  const handleEditStep = useCallback(
    (data: {
      name: string;
      description: string;
      type: WorkflowStepType;
      config: Record<string, unknown> | null;
    }) => {
      if (!editingStep) return;

      const updated: LocalStep = {
        ...editingStep,
        name: data.name,
        description: data.description || null,
        type: data.type,
        config: data.config,
      };

      setSteps((prev) =>
        prev.map((s) => (s.id === editingStep.id ? updated : s))
      );

      if (activeTemplateId && !editingStep.isLocal) {
        updateStepsMut.mutate([
          {
            id: editingStep.id,
            name: data.name,
            description: data.description || null,
            type: data.type,
            config: data.config,
          },
        ]);
      }

      setEditingStep(null);
    },
    [editingStep, activeTemplateId, updateStepsMut]
  );

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    try {
      if (!activeTemplateId) {
        const template = await fetchApi<WorkflowTemplateListItem>(
          '/api/workflows',
          {
            method: 'POST',
            body: JSON.stringify({
              name: templateName,
              description: templateDescription || undefined,
              category: templateCategory || undefined,
            }),
          }
        );

        const newId = template.id;
        const idMap = new Map<string, string>();

        for (const step of steps) {
          const created = await fetchApi<WorkflowStepItem>(
            `/api/workflows/${newId}/steps`,
            {
              method: 'POST',
              body: JSON.stringify({
                name: step.name,
                description: step.description,
                type: step.type,
                order: step.order,
                config: step.config,
                positionX: step.positionX,
                positionY: step.positionY,
              }),
            }
          );
          idMap.set(step.id, created.id);
        }

        for (const t of transitions) {
          await fetchApi<WorkflowTransitionItem>(
            `/api/workflows/${newId}/transitions`,
            {
              method: 'POST',
              body: JSON.stringify({
                fromStepId: idMap.get(t.fromStepId) ?? t.fromStepId,
                toStepId: idMap.get(t.toStepId) ?? t.toStepId,
                label: t.label,
                condition: t.condition,
              }),
            }
          );
        }

        toast.success('Workflow created');
        router.push(`/workflows/builder?templateId=${newId}`);
      } else {
        await updateTemplateMut.mutateAsync({
          id: activeTemplateId,
          data: {
            name: templateName,
            description: templateDescription || null,
            category: templateCategory || null,
          },
        });
        toast.success('Workflow saved');
      }
    } catch {
      toast.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    activeTemplateId,
    templateName,
    templateDescription,
    templateCategory,
    steps,
    transitions,
    updateTemplateMut,
    router,
  ]);

  const handleCanvasClick = useCallback(() => {
    setSelectedStepId(null);
    setSelectedTransitionId(null);
    if (connectingFrom) setConnectingFrom(null);
  }, [connectingFrom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        )
          return;

        if (selectedStepId) {
          handleDeleteStep(selectedStepId);
        } else if (selectedTransitionId) {
          handleDeleteTransition(selectedTransitionId);
        }
      }

      if (e.key === 'Escape') {
        setConnectingFrom(null);
        setSelectedStepId(null);
        setSelectedTransitionId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStepId, selectedTransitionId, handleDeleteStep, handleDeleteTransition]);

  const maxX =
    steps.length > 0
      ? Math.max(...steps.map((s) => s.positionX + STEP_WIDTH + 60))
      : 0;
  const maxY =
    steps.length > 0
      ? Math.max(...steps.map((s) => s.positionY + 140))
      : 0;
  const canvasWidth = Math.max(1000, maxX);
  const canvasHeight = Math.max(600, maxY);

  if (isLoading && templateId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Workflow Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {templateName}
            {!activeTemplateId && (
              <Badge variant="secondary" className="ml-2">
                Unsaved
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connectingFrom && (
            <Badge variant="default" className="animate-pulse">
              <Link2 className="h-3 w-3 mr-1" />
              Click a target step to connect
            </Badge>
          )}
          {selectedTransitionId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteTransition(selectedTransitionId)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Transition
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Builder area */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Step type toolbar */}
        <div className="w-56 shrink-0">
          <Card className="h-full overflow-auto">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
                Step Types
              </p>
              {STEP_TYPES.map((st) => (
                <button
                  key={st.type}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 cursor-pointer transition-all group text-left"
                  onClick={() => handleAddStep(st.type)}
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${st.color}`}
                  >
                    <st.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{st.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {st.description}
                    </p>
                  </div>
                </button>
              ))}

              {steps.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                    Stats
                  </p>
                  <div className="px-1 space-y-1 text-xs text-muted-foreground">
                    <p>{steps.length} steps</p>
                    <p>{transitions.length} transitions</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator orientation="vertical" />

        {/* Canvas */}
        <div className="flex-1 overflow-auto rounded-xl border bg-muted/20">
          <div
            className="relative"
            style={{ width: canvasWidth, height: canvasHeight }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCanvasClick();
            }}
          >
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* SVG transition layer */}
            <svg
              className="absolute inset-0"
              width={canvasWidth}
              height={canvasHeight}
              style={{ pointerEvents: 'none' }}
            >
              <TransitionDefs />
              {transitions.map((t) => {
                const from = steps.find((s) => s.id === t.fromStepId);
                const to = steps.find((s) => s.id === t.toStepId);
                if (!from || !to) return null;
                return (
                  <TransitionLine
                    key={t.id}
                    fromX={from.positionX}
                    fromY={from.positionY}
                    toX={to.positionX}
                    toY={to.positionY}
                    label={t.label}
                    isSelected={selectedTransitionId === t.id}
                    onClick={() => {
                      setSelectedTransitionId(
                        t.id === selectedTransitionId ? null : t.id
                      );
                      setSelectedStepId(null);
                    }}
                  />
                );
              })}
            </svg>

            {/* Step nodes */}
            {steps.map((step) => (
              <StepNode
                key={step.id}
                id={step.id}
                name={step.name}
                description={step.description}
                type={step.type}
                order={step.order}
                positionX={step.positionX}
                positionY={step.positionY}
                isSelected={selectedStepId === step.id}
                isConnectTarget={connectingFrom !== null && connectingFrom !== step.id}
                onPointerDown={(e) => handleStepPointerDown(step.id, e)}
                onClick={() => {
                  if (connectingFrom) {
                    handleConnect(step.id);
                  } else {
                    setSelectedStepId(
                      step.id === selectedStepId ? null : step.id
                    );
                    setSelectedTransitionId(null);
                  }
                }}
                onDoubleClick={() => setEditingStep(step)}
                onConnectStart={() => setConnectingFrom(step.id)}
                onConnectEnd={() => {
                  if (connectingFrom && connectingFrom !== step.id) {
                    handleConnect(step.id);
                  }
                }}
                onDelete={() => handleDeleteStep(step.id)}
              />
            ))}

            {/* Empty state */}
            {steps.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-background border shadow-sm mb-4">
                  <GitBranch className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold">
                  Start building your workflow
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click a step type from the panel on the left to add steps
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step editor sheet — key forces remount on step change */}
      <StepEditor
        key={editingStep?.id ?? 'none'}
        open={editingStep !== null}
        onClose={() => setEditingStep(null)}
        step={editingStep}
        onSave={handleEditStep}
      />

      {/* Template settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workflow Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Workflow name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                placeholder="e.g. Engineering, Support"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => setSettingsOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
