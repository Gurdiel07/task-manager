import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { createMockTicket } from "@/test/factories";
import { useTickets, useCreateTicket } from "@/hooks/use-tickets";

// Suppress toast errors in hook tests
vi.mock("sonner", () => ({ toast: { error: vi.fn(), info: vi.fn() } }));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useTickets()", () => {
  it("fetches and returns tickets from the API", async () => {
    const tickets = [
      createMockTicket({ id: "t1", title: "Ticket Alpha" }),
      createMockTicket({ id: "t2", title: "Ticket Beta" }),
    ];

    server.use(
      http.get("/api/tickets", () =>
        HttpResponse.json({
          success: true,
          data: { tickets, total: 2, page: 1, totalPages: 1 },
        })
      )
    );

    const { result } = renderHook(() => useTickets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tickets).toHaveLength(2);
    expect(result.current.data?.tickets[0].title).toBe("Ticket Alpha");
  });

  it("returns empty tickets list when API returns no tickets", async () => {
    server.use(
      http.get("/api/tickets", () =>
        HttpResponse.json({
          success: true,
          data: { tickets: [], total: 0, page: 1, totalPages: 1 },
        })
      )
    );

    const { result } = renderHook(() => useTickets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tickets).toHaveLength(0);
    expect(result.current.data?.total).toBe(0);
  });

  it("enters error state when the API returns a failure", async () => {
    server.use(
      http.get("/api/tickets", () =>
        HttpResponse.json(
          { success: false, error: "Unauthorized", message: "Not signed in" },
          { status: 401 }
        )
      )
    );

    const { result } = renderHook(() => useTickets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe("useCreateTicket()", () => {
  it("sends a POST request and returns the created ticket", async () => {
    const newTicket = createMockTicket({ title: "Brand New Ticket" });

    server.use(
      http.post("/api/tickets", () =>
        HttpResponse.json(
          { success: true, data: newTicket, message: "Ticket created successfully" },
          { status: 201 }
        )
      )
    );

    const { result } = renderHook(() => useCreateTicket(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: "Brand New Ticket",
      description: "Some description",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe("Brand New Ticket");
  });

  it("enters error state when creation fails", async () => {
    server.use(
      http.post("/api/tickets", () =>
        HttpResponse.json(
          { success: false, error: "Validation failed", message: "Title is required" },
          { status: 400 }
        )
      )
    );

    const { result } = renderHook(() => useCreateTicket(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ title: "", description: "" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
