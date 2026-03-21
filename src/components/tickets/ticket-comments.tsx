'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getInitials } from '@/lib/ticket-options';
import type { TicketCommentItem } from '@/types/tickets';

interface TicketCommentsProps {
  comments: TicketCommentItem[];
  loading?: boolean;
  canCreateInternal: boolean;
  isSubmitting?: boolean;
  onSubmit: (input: { content: string; isInternal?: boolean }) => Promise<unknown>;
}

export function TicketComments({
  comments,
  loading,
  canCreateInternal,
  isSubmitting,
  onSubmit,
}: TicketCommentsProps) {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) {
      return;
    }

    await onSubmit({
      content: content.trim(),
      isInternal: canCreateInternal ? isInternal : false,
    });

    setContent('');
    setIsInternal(false);
  }

  function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    void handleSubmit();
  }

  return (
    <div className="space-y-3">
      {loading
        ? Array.from({ length: 3 }).map((_, index) => (
            <Card key={`comment-skeleton-${index}`}>
              <CardContent className="pb-4 pt-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="ml-auto h-4 w-28" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        : comments.map((comment) => (
            <Card
              key={comment.id}
              className={
                comment.isInternal
                  ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20'
                  : ''
              }
            >
              <CardContent className="pb-4 pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(comment.user.name ?? comment.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.user.name ?? comment.user.email}
                      </span>
                      {comment.isInternal && (
                        <Badge
                          variant="outline"
                          className="border-yellow-400 text-[10px] text-yellow-700 dark:text-yellow-400"
                        >
                          Internal Note
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

      <Card>
        <CardContent className="space-y-3 pt-4">
          <form onSubmit={handleFormSubmit}>
            <Textarea
              placeholder="Add a comment or internal note..."
              className="min-h-24 resize-none"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="internal-note"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                  disabled={!canCreateInternal}
                />
                <Label htmlFor="internal-note" className="cursor-pointer text-sm">
                  Internal note
                </Label>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !content.trim()}
              >
                <Send className="mr-2 h-3.5 w-3.5" />
                Add Comment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
