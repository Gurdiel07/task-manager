import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';

const createBadgeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  criteria: z.record(z.string(), z.unknown()),
});

export async function GET(request: NextRequest) {
  void request;
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }

  try {
    const badges = await db.badge.findMany({
      orderBy: { name: 'asc' },
    });
    return apiSuccess(badges);
  } catch (error) {
    console.error('Failed to fetch badges:', error);
    return apiError('Failed to fetch badges', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return apiError('Forbidden', { status: 403, message: 'Only admins can create badges' });
  }

  try {
    const body = await request.json() as unknown;
    const validated = createBadgeSchema.safeParse(body);

    if (!validated.success) {
      return apiError('Validation failed', {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(', '),
      });
    }

    const badge = await db.badge.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        icon: validated.data.icon,
        criteria: validated.data.criteria as Prisma.InputJsonValue,
      },
    });

    return apiSuccess(badge, { status: 201 });
  } catch (error) {
    console.error('Failed to create badge:', error);
    return apiError('Failed to create badge', { status: 500 });
  }
}
