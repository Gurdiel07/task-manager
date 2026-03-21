import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiError, apiSuccess } from '@/lib/api-response';
import { z } from 'zod';
import type { UserRole } from '@/generated/prisma/client';

export interface AdminUserItem {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  teamNames: string[];
}

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT', 'CUSTOMER']).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  void request;
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return apiError('Forbidden', { status: 403 });
  }

  try {
    const users = await db.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        teamMembers: {
          select: { team: { select: { name: true } } },
        },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    const result: AdminUserItem[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      teamNames: u.teamMembers.map((tm) => tm.team.name),
    }));

    return apiSuccess(result);
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
    return apiError('Failed to fetch users', { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return apiError('Forbidden', { status: 403, message: 'Only admins can update users' });
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return apiError('User ID required', { status: 400 });
    }

    const body = await request.json() as unknown;
    const validated = updateUserSchema.safeParse(body);

    if (!validated.success) {
      return apiError('Validation failed', {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(', '),
      });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: validated.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return apiSuccess(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    return apiError('Failed to update user', { status: 500 });
  }
}
