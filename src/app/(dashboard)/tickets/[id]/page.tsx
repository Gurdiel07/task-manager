import { auth } from '@/lib/auth';
import { TicketDetailClient } from '@/components/tickets/ticket-detail-client';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  return (
    <TicketDetailClient
      id={id}
      currentUserId={session?.user.id ?? null}
      currentUserRole={session?.user.role ?? null}
    />
  );
}
