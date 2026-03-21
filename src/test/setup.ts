import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset any request handlers added during tests
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "user-test-id",
        name: "Test User",
        email: "test@example.com",
        role: "AGENT",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: "authenticated",
    update: vi.fn(),
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), themes: ["light", "dark"] }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Suppress console errors in tests unless needed
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (msg.includes("Warning:") || msg.includes("Error: Uncaught")) return;
  originalConsoleError(...args);
};
