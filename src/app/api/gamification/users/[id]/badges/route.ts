import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  void request;
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }

  try {
    const { id } = await params;

    const userBadges = await db.userBadge.findMany({
      where: { userId: id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const result = userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      earnedAt: ub.earnedAt.toISOString(),
    }));

    return apiSuccess(result);
  } catch (error) {
    console.error('Failed to fetch user badges:', error);
    return apiError('Failed to fetch user badges', { status: 500 });
  }
}
