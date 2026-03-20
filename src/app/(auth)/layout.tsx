import { Ticket } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4">
      <div
        className="absolute inset-0 opacity-30 dark:opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(99 102 241 / 0.3) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mb-8 group"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg group-hover:shadow-primary/25 transition-shadow">
            <Ticket className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold text-foreground">TaskFlow</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
