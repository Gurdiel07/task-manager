import Link from 'next/link';
import Image from 'next/image';
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
            <Image
              src="/logo.png"
              alt="TaskFlow Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-base">TaskFlow Support</span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © 2026 TaskFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
