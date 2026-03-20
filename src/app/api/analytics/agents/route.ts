import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getAgentPerformance } from '@/lib/analytics-api';

function parsePeriod(period: string | null): number {
  switch (period) {
    case '7d': return 7;
    case '90d': return 90;
    case '1y': return 365;
    default: return 30;
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return apiError('Unauthorized', { status: 401 });
  }

  try {
    const period = request.nextUrl.searchParams.get('period');
    const days = parsePeriod(period);
    const data = await getAgentPerformance(days);
    return apiSuccess(data);
  } catch (error) {
    console.error('Failed to fetch agent performance:', error);
    return apiError('Failed to fetch agent performance', { status: 500 });
  }
}
