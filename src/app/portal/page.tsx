'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MessageSquare, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KBArticle {
  id: string;
  title: string;
  content?: string;
  category: { id: string; name: string } | null;
  updatedAt: string;
}

interface TicketStatusResult {
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  WAITING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  RESOLVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
};

export default function PortalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [popularArticles, setPopularArticles] = useState<KBArticle[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);

  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketStatus, setTicketStatus] = useState<TicketStatusResult | null>(null);
  const [ticketError, setTicketError] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);

  useEffect(() => {
    async function fetchPopularArticles() {
      try {
        const res = await fetch('/api/public/knowledge-base/articles?limit=6');
        const json = await res.json();
        if (json.success && json.data) {
          setPopularArticles(json.data.articles ?? []);
        }
      } catch {
        /* non-critical */
      } finally {
        setPopularLoading(false);
      }
    }
    fetchPopularArticles();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setArticles([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/public/knowledge-base/articles?search=${encodeURIComponent(searchQuery.trim())}&limit=10`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setArticles(json.data.articles ?? []);
        } else {
          setArticles([]);
        }
      } catch {
        setArticles([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  async function handleCheckStatus() {
    const num = ticketNumber.trim().replace('#', '');
    if (!num) return;

    setTicketLoading(true);
    setTicketError('');
    setTicketStatus(null);

    try {
      const res = await fetch(`/api/public/tickets/status?number=${encodeURIComponent(num)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTicketStatus(json.data);
      } else {
        setTicketError(json.message ?? 'Ticket not found');
      }
    } catch {
      setTicketError('Failed to check ticket status');
    } finally {
      setTicketLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          How can we help you?
        </h1>
        <p className="text-lg text-muted-foreground">
          Search our knowledge base or submit a new request
        </p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for articles, guides, or topics..."
            className="pl-12 h-12 text-base shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {searchQuery.trim() && !searchLoading && articles.length > 0 && (
          <div className="max-w-xl mx-auto text-left space-y-2">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/portal/articles/${article.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{article.title}</p>
                  {article.category && (
                    <p className="text-xs text-muted-foreground">{article.category.name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {searchQuery.trim() && !searchLoading && articles.length === 0 && (
          <p className="text-sm text-muted-foreground">No articles found matching your search.</p>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/portal/new">Submit a Request</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Agent Login</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Popular Articles</h2>
        {popularLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : popularArticles.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {popularArticles.map((article) => (
              <Link
                key={article.id}
                href={`/portal/articles/${article.id}`}
                className="group"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {article.title}
                        </p>
                        {article.category && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {article.category.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No articles published yet.
            </CardContent>
          </Card>
        )}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <Button asChild>
            <Link href="/portal/new">
              <MessageSquare className="mr-2 h-4 w-4" />
              Submit a Request
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Check Ticket Status</h2>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-3">
              Enter your ticket number to check the current status and updates
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. 1234"
                className="max-w-xs"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckStatus();
                }}
              />
              <Button
                variant="outline"
                onClick={handleCheckStatus}
                disabled={ticketLoading || !ticketNumber.trim()}
              >
                {ticketLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check Status'}
              </Button>
            </div>

            {ticketError && (
              <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {ticketError}
              </div>
            )}

            {ticketStatus && (
              <div className="mt-4 rounded-lg border p-4 space-y-2">
                <p className="font-medium text-sm">{ticketStatus.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={statusColors[ticketStatus.status] ?? ''}>
                    {ticketStatus.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">
                    {ticketStatus.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(ticketStatus.createdAt).toLocaleDateString()} &middot;
                  Last updated {new Date(ticketStatus.updatedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
