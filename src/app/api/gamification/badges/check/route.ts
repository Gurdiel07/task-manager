import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { z } from 'zod';

const checkBadgesSchema = z.object({
  userId: z.string().min(1),
});

interface BadgeCriteria {
  ticketsResolved?: number;
  badgeCount?: number;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json() as unknown;
    const validated = checkBadgesSchema.safeParse(body);

    if (!validated.success) {
      return apiError('Validation failed', {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(', '),
      });
    }

    const { userId } = validated.data;

    // Admins can check any user; users can only check themselves
    if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
      return apiError('Forbidden', { status: 403 });
    }

    const [badges, userBadges, resolvedTickets] = await Promise.all([
      db.badge.findMany(),
      db.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
      db.ticket.count({
        where: {
          assignedToId: userId,
          status: { in: ['RESOLVED', 'CLOSED'] },
          deletedAt: null,
        },
      }),
    ]);

    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
    const newlyAwarded: typeof badges = [];

    for (const badge of badges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const criteria = badge.criteria as BadgeCriteria;
      let earned = false;

      if (
        criteria.ticketsResolved !== undefined &&
        resolvedTickets >= criteria.ticketsResolved
      ) {
        earned = true;
      }

      if (earned) {
        await db.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
        newlyAwarded.push(badge);
      }
    }

    return apiSuccess(newlyAwarded);
  } catch (error) {
    console.error('Failed to check badges:', error);
    return apiError('Failed to check badges', { status: 500 });
  }
}
