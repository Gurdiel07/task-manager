'use client';

import { useQuery } from '@tanstack/react-query';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import type { UserFilters, UserListItem } from '@/types/tickets';

const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters = {}) => ['users', 'list', filters] as const,
};

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () =>
      fetchApi<UserListItem[]>(
        `/api/users${buildQueryString({
          role: filters.role,
          search: filters.search,
        })}`
      ),
  });
}

export { userKeys };
