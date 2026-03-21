import { describe, expect, it } from "vitest";
import { createTicketSchema } from "@/lib/validators/ticket";

describe("createTicketSchema", () => {
  const validTicket = {
    title: "My test ticket",
    description: "This is the description of the ticket",
  };

  it("accepts valid ticket data with only required fields", () => {
    const result = createTicketSchema.safeParse(validTicket);
    expect(result.success).toBe(true);
  });

  it("accepts valid ticket data with all optional fields", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      priority: "HIGH",
      channel: "EMAIL",
      category: "Billing",
      subcategory: "Refund",
      assignedToId: crypto.randomUUID(),
      teamId: crypto.randomUUID(),
      dueDate: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("fails when title is missing", () => {
    const result = createTicketSchema.safeParse({ description: "Some description" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("title");
    }
  });

  it("fails when title is an empty string", () => {
    const result = createTicketSchema.safeParse({ ...validTicket, title: "" });
    expect(result.success).toBe(false);
  });

  it("fails when title exceeds 255 characters", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      title: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("fails when description is missing", () => {
    const result = createTicketSchema.safeParse({ title: "My ticket" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("description");
    }
  });

  it("fails with an invalid priority value", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      priority: "SUPER_HIGH",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid priority values", () => {
    for (const priority of ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const) {
      const result = createTicketSchema.safeParse({ ...validTicket, priority });
      expect(result.success, `priority ${priority} should be valid`).toBe(true);
    }
  });

  it("fails with an invalid channel value", () => {
    const result = createTicketSchema.safeParse({
      ...validTicket,
      channel: "TELEGRAM",
    });
    expect(result.success).toBe(false);
  });
});
