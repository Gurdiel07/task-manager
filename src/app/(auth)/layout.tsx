import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-background dark:to-background/95 p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 dark:opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, oklch(0.65 0.2 220 / 0.4) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-background dark:via-background dark:to-[oklch(0.1_0.03_260)]" />
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mb-8 group"
        >
          <Image
            src="/logo.png"
            alt="TaskFlow Logo"
            width={40}
            height={40}
            className="rounded-xl shadow-lg group-hover:shadow-primary/25 transition-all duration-200 dark:glow-primary-sm"
          />
          <span className="text-2xl font-bold text-foreground dark:gradient-text">TaskFlow</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
