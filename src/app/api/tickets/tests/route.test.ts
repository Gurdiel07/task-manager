import { describe, expect, it, vi, beforeEach } from "vitest";
import { createMockTicket } from "@/test/factories";

// Mock dependencies before importing the route
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    ticket: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    ticketHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/ticket-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ticket-api")>();
  return {
    ...actual,
    getSessionUser: vi.fn(),
    getTicketWhere: vi.fn(() => ({})),
    getTicketOrderBy: vi.fn(() => ({ createdAt: "desc" })),
    ticketListInclude: {},
  };
});

vi.mock("@/lib/jobs/automation", () => ({
  runAutomation: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  queueEmail: vi.fn(),
}));

vi.mock("@/lib/realtime/socket-server", () => ({
  emitToUser: vi.fn(),
  emitToTeam: vi.fn(),
}));

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/ticket-api";
import { GET, POST } from "@/app/api/tickets/route";

const mockAuth = vi.mocked(auth);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockGetSessionUser = vi.mocked(getSessionUser);

const mockAgentUser = {
  id: "agent-id",
  name: "Agent User" as string | null,
  email: "agent@example.com",
  image: null as string | null,
  role: "AGENT" as const,
};

function makeGetRequest(query = "") {
  return new NextRequest(`http://localhost/api/tickets${query ? `?${query}` : ""}`);
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    mockGetSessionUser.mockReturnValue(null);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("returns ticket list for authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: mockAgentUser } as never);
    mockGetSessionUser.mockReturnValue(mockAgentUser);

    const tickets = [createMockTicket(), createMockTicket()];
    mockDb.$transaction.mockResolvedValue([tickets, 2] as never);

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.tickets).toHaveLength(2);
    expect(body.data.total).toBe(2);
  });

  it("returns 400 for invalid query parameters", async () => {
    mockAuth.mockResolvedValue({ user: mockAgentUser } as never);
    mockGetSessionUser.mockReturnValue(mockAgentUser);

    const response = await GET(makeGetRequest("status=INVALID_STATUS"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

describe("POST /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    mockGetSessionUser.mockReturnValue(null);

    const response = await POST(makePostRequest({ title: "Test", description: "Desc" }));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("creates a ticket for authenticated user and returns 201", async () => {
    mockAuth.mockResolvedValue({ user: mockAgentUser } as never);
    mockGetSessionUser.mockReturnValue(mockAgentUser);

    const ticket = createMockTicket({ title: "New ticket", description: "A description" });
    mockDb.$transaction.mockResolvedValue(ticket as never);

    const response = await POST(makePostRequest({
      title: "New ticket",
      description: "A description",
    }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe("Ticket created successfully");
  });

  it("returns 400 for invalid ticket data (missing title)", async () => {
    mockAuth.mockResolvedValue({ user: mockAgentUser } as never);
    mockGetSessionUser.mockReturnValue(mockAgentUser);

    const response = await POST(makePostRequest({ description: "A description" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 when body is invalid JSON", async () => {
    mockAuth.mockResolvedValue({ user: mockAgentUser } as never);
    mockGetSessionUser.mockReturnValue(mockAgentUser);

    const response = await POST(new Request("http://localhost/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    }));

    expect(response.status).toBe(400);
  });
});
