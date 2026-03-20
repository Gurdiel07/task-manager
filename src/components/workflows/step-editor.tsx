'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { WorkflowStepType } from '@/generated/prisma/client';

interface StepData {
  id: string;
  name: string;
  description: string | null;
  type: WorkflowStepType;
  config: Record<string, unknown> | null;
}

interface StepEditorProps {
  open: boolean;
  onClose: () => void;
  step: StepData | null;
  onSave: (data: {
    name: string;
    description: string;
    type: WorkflowStepType;
    config: Record<string, unknown> | null;
  }) => void;
}

export function StepEditor({ open, onClose, step, onSave }: StepEditorProps) {
  const [name, setName] = useState(step?.name ?? '');
  const [description, setDescription] = useState(step?.description ?? '');
  const [type, setType] = useState<WorkflowStepType>(step?.type ?? 'MANUAL');
  const [config, setConfig] = useState<Record<string, unknown>>(
    (step?.config as Record<string, unknown>) ?? {}
  );

  const handleSave = () => {
    onSave({
      name,
      description,
      type,
      config: Object.keys(config).length > 0 ? config : null,
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Step</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Step name"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as WorkflowStepType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                <SelectItem value="APPROVAL">Approval</SelectItem>
                <SelectItem value="CONDITION">Condition</SelectItem>
                <SelectItem value="NOTIFICATION">Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'APPROVAL' && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Approval Settings
              </p>
              <div className="space-y-2">
                <Label>Approver Role</Label>
                <Select
                  value={(config.approverRole as string) ?? ''}
                  onValueChange={(v) =>
                    setConfig({ ...config, approverRole: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="AGENT">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Approval Threshold</Label>
                <Input
                  type="number"
                  min={1}
                  value={(config.threshold as number) ?? 1}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      threshold: parseInt(e.target.value) || 1,
                    })
                  }
                  placeholder="Number of approvals required"
                />
              </div>
            </div>
          )}

          {type === 'CONDITION' && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Condition
              </p>
              <div className="space-y-2">
                <Label>Field</Label>
                <Input
                  value={(config.field as string) ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, field: e.target.value })
                  }
                  placeholder="e.g. priority"
                />
              </div>
              <div className="space-y-2">
                <Label>Operator</Label>
                <Select
                  value={(config.operator as string) ?? ''}
                  onValueChange={(v) =>
                    setConfig({ ...config, operator: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eq">Equals</SelectItem>
                    <SelectItem value="neq">Not Equals</SelectItem>
                    <SelectItem value="gt">Greater Than</SelectItem>
                    <SelectItem value="lt">Less Than</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="in">In</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  value={(config.value as string) ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, value: e.target.value })
                  }
                  placeholder="e.g. CRITICAL"
                />
              </div>
            </div>
          )}

          {type === 'NOTIFICATION' && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notification
              </p>
              <div className="space-y-2">
                <Label>Template</Label>
                <Input
                  value={(config.template as string) ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, template: e.target.value })
                  }
                  placeholder="Notification template name"
                />
              </div>
              <div className="space-y-2">
                <Label>Recipients</Label>
                <Input
                  value={(config.recipients as string) ?? ''}
                  onChange={(e) =>
                    setConfig({ ...config, recipients: e.target.value })
                  }
                  placeholder="Comma-separated emails or roles"
                />
              </div>
            </div>
          )}

          {type === 'AUTOMATIC' && (
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Automatic steps execute system actions. Configuration for
                automatic actions will be available in a future update.
              </p>
            </div>
          )}

          {type === 'MANUAL' && (
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Manual steps require a human to perform the action and mark it
                as complete.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
