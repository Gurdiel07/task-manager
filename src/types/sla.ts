export interface SLAPolicyItem {
  id: string;
  name: string;
  description: string | null;
  conditions: Record<string, unknown>;
  responseTimeMin: number;
  resolutionMin: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { breaches: number };
}

export interface SLABreachItem {
  id: string;
  ticketId: string;
  policyId: string;
  type: "FIRST_RESPONSE" | "RESOLUTION";
  breachedAt: string;
  notifiedAt: string | null;
  ticket: { id: string; number: number; title: string };
  policy: { id: string; name: string };
}

export interface SLAPolicyFilters {
  isActive?: boolean;
}

export interface SLABreachFilters {
  ticketId?: string;
  policyId?: string;
  type?: "FIRST_RESPONSE" | "RESOLUTION";
  page?: number;
  limit?: number;
}

export interface PaginatedSLABreachesResponse {
  breaches: SLABreachItem[];
  total: number;
  page: number;
  totalPages: number;
}
