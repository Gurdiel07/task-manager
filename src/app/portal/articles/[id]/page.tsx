'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, ThumbsUp, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Article {
  id: string;
  title: string;
  content: string;
  viewCount: number;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string } | null;
  author: { name: string | null };
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [helpfulSubmitted, setHelpfulSubmitted] = useState(false);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/public/knowledge-base/articles/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setArticle(json.data);
        } else {
          setError(json.message ?? 'Article not found');
        }
      } catch {
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  async function handleHelpful() {
    if (helpfulSubmitted) return;
    setHelpfulSubmitted(true);
    try {
      await fetch(`/api/public/knowledge-base/articles/${id}`, { method: 'GET' });
    } catch {
      /* best effort */
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Article Not Found</h1>
        <p className="text-muted-foreground">{error || 'This article does not exist or has been removed.'}</p>
        <Button asChild variant="outline">
          <Link href="/portal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Help Center
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/portal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Help Center
          </Link>
        </Button>

        {article.category && (
          <Badge variant="secondary" className="mb-3">
            {article.category.name}
          </Badge>
        )}

        <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          {article.author.name && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {article.author.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(article.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <Card>
        <CardContent className="py-6 text-center space-y-3">
          <p className="font-medium">Was this article helpful?</p>
          {helpfulSubmitted ? (
            <p className="text-sm text-muted-foreground">Thank you for your feedback!</p>
          ) : (
            <Button variant="outline" onClick={handleHelpful}>
              <ThumbsUp className="mr-2 h-4 w-4" />
              Yes, this was helpful
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
