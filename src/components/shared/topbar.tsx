'use client';

import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/shared/notification-bell';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { SearchCommand } from '@/components/shared/search-command';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSocket } from '@/hooks/use-socket';

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  tickets: 'Tickets',
  workflows: 'Workflows',
  tasks: 'Tasks',
  analytics: 'Analytics',
  'knowledge-base': 'Knowledge Base',
  settings: 'Settings',
  ai: 'AI Config',
  sla: 'SLA Policies',
  channels: 'Channels',
  teams: 'Teams',
  automation: 'Automation',
  admin: 'Admin',
  new: 'New',
  builder: 'Builder',
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Dashboard', href: '/', isLast: true }];
  }

  const crumbs = [{ label: 'Dashboard', href: '/', isLast: false }];

  let currentPath = '';
  segments.forEach((segment, i) => {
    currentPath += `/${segment}`;
    const label =
      segment.startsWith('#') || /^\d+$/.test(segment) || segment.length > 20
        ? `#${segment}`
        : (routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1));

    crumbs.push({
      label,
      href: currentPath,
      isLast: i === segments.length - 1,
    });
  });

  return crumbs;
}

function ConnectionIndicator() {
  const { isConnected } = useSocket();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center h-8 w-8">
            <span
              className={`h-2 w-2 rounded-full transition-colors ${
                isConnected
                  ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.4)]'
                  : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]'
              }`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {isConnected ? 'Real-time: connected' : 'Real-time: disconnected'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <>
      <SearchCommand />
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-card/50 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <Breadcrumb className="flex-1">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search (⌘K)</span>
          </Button>

          <NotificationBell />

          <ConnectionIndicator />
        </div>
      </header>
    </>
  );
}
