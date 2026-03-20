'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, GitBranch, Play, Pause, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWorkflows } from '@/hooks/use-workflows';
import type { WorkflowFilters } from '@/types/workflows';

export default function WorkflowsPage() {
  const [filters, setFilters] = useState<WorkflowFilters>({});
  const { data, isLoading } = useWorkflows(filters);
  const templates = data?.templates ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and automate ticket processing workflows
          </p>
        </div>
        <Button asChild>
          <Link href="/workflows/builder">
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            className="pl-9"
            value={filters.search ?? ''}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value || undefined }))
            }
          />
        </div>
        <Button
          variant={filters.isActive === true ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            setFilters((f) => ({
              ...f,
              isActive: f.isActive === true ? undefined : true,
            }))
          }
        >
          Active Only
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <GitBranch className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No workflows found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {filters.search
              ? 'Try adjusting your search terms'
              : 'Create your first workflow to automate ticket processing'}
          </p>
          {!filters.search && (
            <Button asChild size="sm">
              <Link href="/workflows/builder">
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((workflow) => (
            <Link key={workflow.id} href={`/workflows/${workflow.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer h-full group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                        <GitBranch className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
                          {workflow.name}
                        </CardTitle>
                        {workflow.category && (
                          <p className="text-xs text-muted-foreground">
                            {workflow.category}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        workflow.isActive
                          ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900'
                          : 'border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                      }
                    >
                      {workflow.isActive ? (
                        <Play className="h-2.5 w-2.5 mr-1" />
                      ) : (
                        <Pause className="h-2.5 w-2.5 mr-1" />
                      )}
                      {workflow.isActive ? 'active' : 'inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workflow.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workflow.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>{workflow._count.steps} steps</span>
                      <span>·</span>
                      <span className="text-primary font-medium">
                        {workflow._count.instances} active
                      </span>
                    </div>
                    <span>
                      Updated{' '}
                      {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
