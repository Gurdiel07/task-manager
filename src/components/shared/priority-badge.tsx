import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

const priorityConfig: Record<Priority, { label: string; className: string }> =
  {
    CRITICAL: {
      label: 'Critical',
      className:
        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    },
    HIGH: {
      label: 'High',
      className:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    },
    MEDIUM: {
      label: 'Medium',
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    },
    LOW: {
      label: 'Low',
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    },
  };

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  if (!config) return null;

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium gap-1', config.className, className)}
    >
      {priority === 'CRITICAL' && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot" />
      )}
      {config.label}
    </Badge>
  );
}
