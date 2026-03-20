import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number;
    message?: string;
  }
) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
      message: options?.message,
    },
    { status: options?.status ?? 200 }
  );
}

export function apiError(
  error: string,
  options?: {
    status?: number;
    message?: string;
  }
) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error,
      message: options?.message,
    },
    { status: options?.status ?? 500 }
  );
}
