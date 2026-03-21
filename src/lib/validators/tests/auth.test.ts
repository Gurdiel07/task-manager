import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validators/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("fails with an invalid email address", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("email");
    }
  });

  it("fails when email is missing", () => {
    const result = loginSchema.safeParse({ password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("fails when password is shorter than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("password");
    }
  });

  it("accepts a password that is exactly 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "abcdef",
    });
    expect(result.success).toBe(true);
  });

  it("fails when password is missing", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    name: "Alice Smith",
    email: "alice@example.com",
    password: "supersecret",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails when name is shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...validData, name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("name");
    }
  });

  it("fails with an invalid email", () => {
    const result = registerSchema.safeParse({ ...validData, email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("fails when password is shorter than 6 characters", () => {
    const result = registerSchema.safeParse({ ...validData, password: "12345" });
    expect(result.success).toBe(false);
  });

  it("fails when required fields are missing", () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
