import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppSidebar } from '@/components/shared/app-sidebar';
import { Topbar } from '@/components/shared/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SocketWrapper } from '@/components/shared/socket-wrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = {
    name: session.user.name ?? null,
    email: session.user.email,
    image: session.user.image ?? null,
    role: session.user.role,
  };

  return (
    <SocketWrapper>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <Topbar />
          <main className="min-w-0 flex-1 overflow-auto p-6 dark:bg-gradient-to-br dark:from-background dark:to-background/95">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SocketWrapper>
  );
}
