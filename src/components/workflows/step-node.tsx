'use client';

import type { WorkflowStepType } from '@/generated/prisma/client';
import { cn } from '@/lib/utils';
import {
  MousePointer2,
  Zap,
  CheckCircle,
  GitBranch,
  Bell,
  Pencil,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const STEP_WIDTH = 200;
export const STEP_NODE_HEIGHT = 96;

export const stepTypeConfig: Record<
  WorkflowStepType,
  {
    icon: typeof MousePointer2;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  MANUAL: {
    icon: MousePointer2,
    color: '#3B82F6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    label: 'Manual',
  },
  AUTOMATIC: {
    icon: Zap,
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    label: 'Automatic',
  },
  APPROVAL: {
    icon: CheckCircle,
    color: '#F59E0B',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    label: 'Approval',
  },
  CONDITION: {
    icon: GitBranch,
    color: '#8B5CF6',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    label: 'Condition',
  },
  NOTIFICATION: {
    icon: Bell,
    color: '#F97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    label: 'Notification',
  },
};

interface StepNodeProps {
  id: string;
  name: string;
  description: string | null;
  type: WorkflowStepType;
  order: number;
  positionX: number;
  positionY: number;
  isSelected: boolean;
  isConnectTarget: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: () => void;
  onDoubleClick: () => void;
  onConnectStart: () => void;
  onConnectEnd: () => void;
  onDelete: () => void;
}

export function StepNode({
  name,
  description,
  type,
  order,
  positionX,
  positionY,
  isSelected,
  isConnectTarget,
  onPointerDown,
  onClick,
  onDoubleClick,
  onConnectStart,
  onConnectEnd,
  onDelete,
}: StepNodeProps) {
  const config = stepTypeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'absolute select-none rounded-xl border-2 bg-card shadow-md transition-shadow cursor-grab active:cursor-grabbing group/step',
        isSelected
          ? 'border-primary shadow-lg ring-2 ring-primary/20'
          : 'border-border hover:shadow-lg',
        isConnectTarget && 'ring-2 ring-blue-400/50 border-blue-400'
      )}
      style={{ left: positionX, top: positionY, width: STEP_WIDTH }}
      onPointerDown={(e) => {
        if (
          (e.target as HTMLElement).closest('[data-connector]') ||
          (e.target as HTMLElement).closest('button')
        )
          return;
        onPointerDown(e);
      }}
      onClick={(e) => {
        if (
          (e.target as HTMLElement).closest('[data-connector]') ||
          (e.target as HTMLElement).closest('button')
        )
          return;
        onClick();
      }}
      onDoubleClick={(e) => {
        if (
          (e.target as HTMLElement).closest('[data-connector]') ||
          (e.target as HTMLElement).closest('button')
        )
          return;
        onDoubleClick();
      }}
    >
      {/* Top connection point */}
      <div
        data-connector="top"
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-muted-foreground/30 bg-background hover:border-primary hover:scale-125 cursor-crosshair z-10 flex items-center justify-center transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onConnectEnd();
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
      </div>

      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
              config.bgColor
            )}
            style={{ color: config.color }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{name}</p>
            {description && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0"
            style={{ borderColor: config.color, color: config.color }}
          >
            {config.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            Step {order + 1}
          </span>
        </div>
      </div>

      {/* Bottom connection point */}
      <div
        data-connector="bottom"
        className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-muted-foreground/30 bg-background hover:border-primary hover:scale-125 cursor-crosshair z-10 flex items-center justify-center transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onConnectStart();
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
      </div>

      {/* Action buttons (selected state) */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 flex gap-1 z-20">
          <button
            className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDoubleClick();
            }}
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
