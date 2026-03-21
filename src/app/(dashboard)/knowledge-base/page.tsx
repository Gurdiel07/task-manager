'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, BookOpen, Eye, ThumbsUp, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKBCategories, useKBArticles } from '@/hooks/use-knowledge-base';
import type { KBArticleFilters } from '@/types/knowledge-base';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: 'default',
  DRAFT: 'secondary',
  ARCHIVED: 'outline',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoriesQuery = useKBCategories();
  const { data: categories, isLoading: categoriesLoading } = categoriesQuery;

  const filters: KBArticleFilters = {
    search: debouncedSearch || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
    limit: 30,
  };
  const articlesQuery = useKBArticles(filters);
  const { data: articlesData, isLoading: articlesLoading } = articlesQuery;

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  }

  const failedQuery = categoriesQuery.isError
    ? categoriesQuery
    : articlesQuery.isError
    ? articlesQuery
    : null;

  if (failedQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground mt-1">
          {failedQuery.error?.message ?? 'An unexpected error occurred'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            if (categoriesQuery.isError) void categoriesQuery.refetch();
            if (articlesQuery.isError) void articlesQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Articles, guides, and documentation
          </p>
        </div>
        <Button onClick={() => router.push('/knowledge-base/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Article
        </Button>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          className="pl-9"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
                Categories
              </p>
              <div className="space-y-0.5">
                <button
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                    !categoryId
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setCategoryId('')}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    All Articles
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {articlesData?.total ?? 0}
                  </Badge>
                </button>
                {categoriesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-full rounded-md" />
                  ))
                ) : (
                  categories?.map((cat) => (
                    <button
                      key={cat.id}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                        categoryId === cat.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setCategoryId(cat.id)}
                    >
                      <span className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5" />
                        {cat.name}
                      </span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {cat._count.articles}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList>
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {articlesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : articlesData?.articles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No articles found. Try adjusting your search or filters.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {articlesData?.articles.map((article) => (
                <Card
                  key={article.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/knowledge-base/${article.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{article.title}</h3>
                          <Badge
                            variant={(STATUS_COLORS[article.status] as 'default' | 'secondary' | 'outline') ?? 'secondary'}
                            className="text-[10px] h-4 px-1.5"
                          >
                            {article.status}
                          </Badge>
                          {article.category && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              {article.category.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>By {article.author.name ?? article.author.email}</span>
                          <span>·</span>
                          <span>{formatDate(article.updatedAt)}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {article.helpfulCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
