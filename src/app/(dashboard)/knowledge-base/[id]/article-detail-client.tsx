'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Eye,
  ThumbsUp,
  Pencil,
  Trash2,
  Calendar,
  User,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { useKBArticle, useMarkHelpful, useDeleteKBArticle } from '@/hooks/use-knowledge-base';
import { useSession } from 'next-auth/react';

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  PUBLISHED: 'default',
  DRAFT: 'secondary',
  ARCHIVED: 'outline',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ArticleDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: article, isLoading } = useKBArticle(id);
  const markHelpful = useMarkHelpful();
  const deleteArticle = useDeleteKBArticle();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [markedHelpful, setMarkedHelpful] = useState(false);

  const userId = session?.user?.id;
  const userRole = session?.user?.role as string | undefined;
  const isAuthor = article?.author.id === userId;
  const isPrivileged = userRole === 'ADMIN' || userRole === 'MANAGER';
  const canEdit = isAuthor || isPrivileged;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-48" />
        <Separator />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Article not found.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/knowledge-base">Back to Knowledge Base</Link>
        </Button>
      </div>
    );
  }

  function handleMarkHelpful() {
    if (markedHelpful) return;
    markHelpful.mutate(id, { onSuccess: () => setMarkedHelpful(true) });
  }

  function handleDelete() {
    deleteArticle.mutate(id, {
      onSuccess: () => router.push('/knowledge-base'),
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground -ml-2">
          <Link href="/knowledge-base">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/knowledge-base/${id}/edit`)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={STATUS_COLORS[article.status] ?? 'secondary'}>
            {article.status}
          </Badge>
          {article.category && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {article.category.name}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {article.author.name ?? article.author.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(article.updatedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {article.viewCount} views
          </span>
          <span className="flex items-center gap-1.5">
            <ThumbsUp className="h-3.5 w-3.5" />
            {article.helpfulCount} helpful
          </span>
        </div>
      </div>

      <Separator />

      <div className="prose prose-sm max-w-none">
        {article.content.split('\n').map((line, i) => (
          <p key={i} className="mb-2 text-sm leading-relaxed text-foreground">
            {line}
          </p>
        ))}
      </div>

      <Separator />

      <div className="flex items-center justify-center py-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Was this article helpful?</p>
          <Button
            variant={markedHelpful ? 'default' : 'outline'}
            size="sm"
            disabled={markedHelpful || markHelpful.isPending}
            onClick={handleMarkHelpful}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            {markedHelpful ? 'Thanks for your feedback!' : 'Yes, this helped'}
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{article.title}&rdquo;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
