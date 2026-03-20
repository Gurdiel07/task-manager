'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { WorkflowBuilder } from '@/components/workflows/workflow-builder';

function BuilderContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  return <WorkflowBuilder templateId={templateId} />;
}

export default function WorkflowBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
