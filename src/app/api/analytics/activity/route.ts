import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getActivityFeed } from '@/lib/analytics-api';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }

  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20;
    const data = await getActivityFeed(limit);
    return apiSuccess(data);
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return apiError('Failed to fetch activity feed', { status: 500 });
  }
}
