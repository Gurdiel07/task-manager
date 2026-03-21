'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Ticket,
  GitBranch,
  CheckSquare,
  BarChart3,
  BookOpen,
  Settings,
  Shield,
  ChevronDown,
  User,
  LogOut,
  Bot,
  Clock,
  Mail,
  Users,
  Zap,
  Activity,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
}

const mainNavItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { title: 'Tickets', href: '/tickets', icon: Ticket },
  { title: 'Workflows', href: '/workflows', icon: GitBranch },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare },
];

const insightNavItems = [
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
];

const settingsSubItems = [
  { title: 'AI Config', href: '/settings/ai', icon: Bot },
  { title: 'SLA Policies', href: '/settings/sla', icon: Clock },
  { title: 'Channels', href: '/settings/channels', icon: Mail },
  { title: 'Teams', href: '/settings/teams', icon: Users },
  { title: 'Automation', href: '/settings/automation', icon: Zap },
];

function getInitials(name: string | null, email: string) {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.[0]?.toUpperCase() ?? '?';
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    AGENT: 'Agent',
    CUSTOMER: 'Customer',
  };
  return labels[role] ?? role;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isSettingsActive = pathname.startsWith('/settings');

  return (
    <Sidebar collapsible="icon" className="dark:shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.05)]">
      <SidebarHeader className="bg-gradient-to-b from-sidebar to-transparent">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-base">Task Manager</span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href, item.exact)}
                    tooltip={item.title}
                    className="transition-all duration-200"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    className="transition-all duration-200"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen={isSettingsActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isSettingsActive}
                      tooltip="Settings"
                      className="transition-all duration-200"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {settingsSubItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.href}
                          >
                            <Link href={item.href}>
                              <item.icon className="h-3 w-3" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {user.role === 'ADMIN' && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/admin') && !pathname.startsWith('/admin/queues')}
                      tooltip="Admin"
                    >
                      <Link href="/admin">
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/admin/queues')}
                      tooltip="Background Jobs"
                    >
                      <Link href="/admin/queues">
                        <Activity className="h-4 w-4" />
                        <span>Background Jobs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive('/admin/email')}
                      tooltip="Email"
                    >
                      <Link href="/admin/email">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name ?? user.email}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name ?? user.email}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <User className="mr-2 h-4 w-4" />
                    Profile & Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-0">
                  <div className="flex items-center w-full px-2 py-1.5">
                    <span className="mr-2 text-sm flex-1">Theme</span>
                    <ThemeToggle />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
