'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useMarkNotificationsRead } from '@/hooks/use-gamification';
import type { Notification } from '@/types';

const notificationTypeLabel: Record<string, string> = {
  TICKET_ASSIGNED: '🎫 Ticket Assigned',
  TICKET_UPDATED: '📝 Ticket Updated',
  TICKET_COMMENT: '💬 New Comment',
  WORKFLOW_STEP: '⚙️ Workflow Step',
  SLA_WARNING: '⚠️ SLA Warning',
  SLA_BREACH: '🚨 SLA Breach',
  TASK_ASSIGNED: '✅ Task Assigned',
  TASK_DUE: '⏰ Task Due',
  MENTION: '@ Mention',
  SYSTEM: '🔔 System',
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const typeLabel = notificationTypeLabel[notification.type] ?? '🔔 Notification';

  return (
    <div
      className={`px-4 py-3 hover:bg-muted/50 transition-colors cursor-default ${
        !notification.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-medium text-muted-foreground">
              {typeLabel}
            </span>
            {!notification.isRead && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-sm font-medium leading-snug">{notification.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onRead(notification.id);
              }}
            >
              <Check className="h-3.5 w-3.5" />
              <span className="sr-only">Mark as read</span>
            </Button>
          )}
          {notification.link && (
            <Link
              href={notification.link}
              className="text-[10px] text-primary hover:underline"
            >
              View →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notificationsQuery = useNotifications(false);
  const markReadMutation = useMarkNotificationsRead();

  const notifications = (notificationsQuery.data ?? []) as Notification[];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleMarkRead(id: string) {
    markReadMutation.mutate({ notificationIds: [id] });
  }

  function handleMarkAllRead() {
    markReadMutation.mutate({ all: true });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications ({unreadCount} unread)</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleMarkAllRead}
              disabled={markReadMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        {notificationsQuery.isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y">
              {notifications.slice(0, 20).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkRead}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
