import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Task Manager Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-base">Task Manager Support</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © 2026 Task Manager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
