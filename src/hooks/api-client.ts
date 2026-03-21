'use client';

import type { ApiResponse } from "@/types";

const REQUEST_TIMEOUT_MS = 10_000;

export async function fetchApi<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(input, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const contentType = response.headers.get("Content-Type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        `Server returned an unexpected response (${response.status} ${response.statusText})`
      );
    }

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
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    if (error instanceof TypeError) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
