'use client';

import type { ApiResponse } from "@/types";

export async function fetchApi<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.message ?? payload.error ?? "The request could not be completed"
    );
  }

  if (payload.data === undefined) {
    throw new Error("The server returned an empty response");
  }

  return payload.data;
}

export function buildQueryString(
  params: Record<string, string | number | undefined | null>
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
