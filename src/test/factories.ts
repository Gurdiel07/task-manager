/**
 * Factory functions for creating mock objects in tests.
 * Each factory provides realistic defaults and accepts partial overrides.
 */

export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    name: "Test User",
    email: "test@example.com",
    image: null,
    role: "AGENT" as const,
    hashedPassword: "$2b$12$hashedpassword",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function createMockTicket(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as string) ?? crypto.randomUUID();
  const user = createMockUser({ id: "creator-id", name: "Alice Smith", email: "alice@example.com" });

  return {
    id,
    number: 1,
    title: "Sample ticket",
    description: "This is a sample ticket description",
    status: "OPEN" as const,
    priority: "MEDIUM" as const,
    category: null,
    subcategory: null,
    channel: "WEB" as const,
    createdById: user.id,
    assignedToId: null,
    teamId: null,
    dueDate: null,
    resolvedAt: null,
    closedAt: null,
    firstResponseAt: null,
    createdAt: new Date("2024-01-15T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2024-01-15T10:00:00.000Z").toISOString(),
    createdBy: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    assignedTo: null,
    team: null,
    tags: [],
    ...overrides,
  };
}

export function createMockNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    userId: "user-test-id",
    type: "TICKET_ASSIGNED" as const,
    title: "Ticket assigned to you",
    message: "You have been assigned to ticket #1: Sample ticket",
    link: "/tickets/ticket-1",
    isRead: false,
    createdAt: new Date("2024-01-15T10:00:00.000Z"),
    updatedAt: new Date("2024-01-15T10:00:00.000Z"),
    ...overrides,
  };
}

export function createMockTeam(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    name: "Support Team",
    description: "Main support team",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    members: [],
    ...overrides,
  };
}

export function createMockComment(overrides: Record<string, unknown> = {}) {
  const author = createMockUser({ id: "author-id", name: "Bob Jones" });

  return {
    id: crypto.randomUUID(),
    ticketId: "ticket-1",
    authorId: author.id,
    content: "This is a test comment.",
    isInternal: false,
    createdAt: new Date("2024-01-15T11:00:00.000Z"),
    updatedAt: new Date("2024-01-15T11:00:00.000Z"),
    author: {
      id: author.id,
      name: author.name,
      email: author.email,
      image: author.image,
    },
    ...overrides,
  };
}
