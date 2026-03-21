import { describe, expect, it } from "vitest";
import { apiSuccess, apiError } from "@/lib/api-response";

describe("apiSuccess()", () => {
  it("returns a 200 response with success: true by default", async () => {
    const response = apiSuccess({ id: "1", name: "Test" });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: "1", name: "Test" });
  });

  it("accepts a custom status code", async () => {
    const response = apiSuccess({ id: "1" }, { status: 201 });
    expect(response.status).toBe(201);
  });

  it("includes an optional message", async () => {
    const response = apiSuccess(null, { message: "Created!" });
    const body = await response.json();
    expect(body.message).toBe("Created!");
  });

  it("sets the Content-Type header to application/json", () => {
    const response = apiSuccess({});
    expect(response.headers.get("Content-Type")).toContain("application/json");
  });
});

describe("apiError()", () => {
  it("returns a 500 response with success: false by default", async () => {
    const response = apiError("Something went wrong");
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Something went wrong");
  });

  it("accepts a custom status code", async () => {
    const response = apiError("Not found", { status: 404 });
    expect(response.status).toBe(404);
  });

  it("includes an optional message", async () => {
    const response = apiError("Bad request", { status: 400, message: "Title is required" });
    const body = await response.json();
    expect(body.message).toBe("Title is required");
    expect(body.error).toBe("Bad request");
  });

  it("returns 401 for unauthorized errors", async () => {
    const response = apiError("Unauthorized", { status: 401 });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
