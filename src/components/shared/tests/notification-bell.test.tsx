import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { createMockNotification } from "@/test/factories";

// Mock heavy hooks that have side-effects
vi.mock("@/hooks/use-gamification", () => ({
  useNotifications: vi.fn(() => ({ data: [], isLoading: false })),
  useMarkNotificationsRead: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock("@/hooks/use-socket", () => ({
  useSocketEvent: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { info: vi.fn(), error: vi.fn() } }));

import { useNotifications } from "@/hooks/use-gamification";
import { NotificationBell } from "@/components/shared/notification-bell";

describe("NotificationBell", () => {
  it("renders the bell icon button", () => {
    render(<NotificationBell />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("does not show unread badge when there are no notifications", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useNotifications).mockReturnValue({ data: [], isLoading: false } as any);

    render(<NotificationBell />);
    // No unread count badge should be visible (badge only renders when unreadCount > 0)
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("shows unread count badge when there are unread notifications", () => {
    const notifications = [
      createMockNotification({ isRead: false }),
      createMockNotification({ isRead: false }),
      createMockNotification({ isRead: true }),
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useNotifications).mockReturnValue({ data: notifications, isLoading: false } as any);

    render(<NotificationBell />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows 99+ when there are more than 99 unread notifications", () => {
    const notifications = Array.from({ length: 100 }, () =>
      createMockNotification({ isRead: false })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useNotifications).mockReturnValue({ data: notifications, isLoading: false } as any);

    render(<NotificationBell />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useNotifications).mockReturnValue({ data: undefined, isLoading: true } as any);

    render(<NotificationBell />);
    // The bell button should still be rendered during loading
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
