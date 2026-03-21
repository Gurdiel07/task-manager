import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("returns an empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns a single class name as-is", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class names with a space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting Tailwind classes (last one wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles conditional class application via objects", () => {
    expect(cn({ "bg-red-500": true, "bg-blue-500": false })).toBe("bg-red-500");
  });

  it("handles array inputs", () => {
    expect(cn(["px-2", "py-1"])).toBe("px-2 py-1");
  });

  it("merges p and px/py Tailwind utilities correctly", () => {
    expect(cn("p-4", "px-2")).toBe("p-4 px-2");
  });
});
