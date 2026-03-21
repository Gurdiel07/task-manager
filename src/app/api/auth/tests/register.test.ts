import { describe, expect, it, vi, beforeEach } from "vitest";
import { createMockUser } from "@/test/factories";

// Mock the db module before importing the route
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(() => Promise.resolve("$2b$12$mockedhash")),
    compare: vi.fn(() => Promise.resolve(true)),
  },
  hash: vi.fn(() => Promise.resolve("$2b$12$mockedhash")),
  compare: vi.fn(() => Promise.resolve(true)),
}));

import { db } from "@/lib/db";
import { POST } from "@/app/api/auth/register/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 on successful registration", async () => {
    const createdUser = createMockUser({
      id: "new-user-id",
      name: "Alice",
      email: "alice@example.com",
      role: "CUSTOMER",
    });

    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.user.create.mockResolvedValue(createdUser as never);

    const response = await POST(makeRequest({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe("alice@example.com");
  });

  it("returns 409 when email already exists", async () => {
    const existingUser = createMockUser({ email: "alice@example.com" });
    mockDb.user.findUnique.mockResolvedValue(existingUser as never);

    const response = await POST(makeRequest({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    }));

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("User already exists");
  });

  it("returns 400 for invalid email format", async () => {
    const response = await POST(makeRequest({
      name: "Alice",
      email: "not-an-email",
      password: "password123",
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 when name is too short", async () => {
    const response = await POST(makeRequest({
      name: "A",
      email: "alice@example.com",
      password: "password123",
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 when password is too short", async () => {
    const response = await POST(makeRequest({
      name: "Alice",
      email: "alice@example.com",
      password: "abc",
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 when body is missing required fields", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
