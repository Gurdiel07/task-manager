import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { z } from 'zod';

const markReadSchema = z.union([
  z.object({ notificationIds: z.array(z.string()).min(1), all: z.undefined().optional() }),
  z.object({ all: z.literal(true), notificationIds: z.undefined().optional() }),
]);

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }

  try {
    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true';

    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return apiSuccess(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return apiError('Failed to fetch notifications', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json() as unknown;
    const validated = markReadSchema.safeParse(body);

    if (!validated.success) {
      return apiError('Validation failed', {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(', '),
      });
    }

    const data = validated.data;

    if ('all' in data && data.all === true) {
      await db.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
    } else if ('notificationIds' in data && data.notificationIds) {
      await db.notification.updateMany({
        where: {
          id: { in: data.notificationIds },
          userId: session.user.id,
        },
        data: { isRead: true },
      });
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return apiError('Failed to mark notifications as read', { status: 500 });
  }
}
