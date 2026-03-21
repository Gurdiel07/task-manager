import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { TicketTable } from "@/components/tickets/ticket-table";
import { createMockTicket } from "@/test/factories";
import type { TicketListItem } from "@/types/tickets";

// Cast factory output for component type compatibility
function toTicketListItem(overrides = {}): TicketListItem {
  return createMockTicket(overrides) as unknown as TicketListItem;
}

describe("TicketTable", () => {
  it("renders table headers", () => {
    render(<TicketTable tickets={[]} />);
    expect(screen.getByText("#")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("Assignee")).toBeInTheDocument();
  });

  it("renders a list of tickets", () => {
    const tickets = [
      toTicketListItem({ id: "t1", number: 1, title: "First ticket" }),
      toTicketListItem({ id: "t2", number: 2, title: "Second ticket" }),
    ];

    render(<TicketTable tickets={tickets} />);
    expect(screen.getByText("First ticket")).toBeInTheDocument();
    expect(screen.getByText("Second ticket")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("renders 'Unassigned' when ticket has no assignee", () => {
    const ticket = toTicketListItem({ assignedTo: null });
    render(<TicketTable tickets={[ticket]} />);
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("renders assignee name when ticket is assigned", () => {
    const ticket = toTicketListItem({
      assignedTo: {
        id: "user-1",
        name: "Jane Doe",
        email: "jane@example.com",
        image: null,
      },
    });
    render(<TicketTable tickets={[ticket]} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("shows skeleton rows when loading", () => {
    const { container } = render(<TicketTable tickets={[]} loading={true} />);
    // Should render skeleton elements (they are div elements with skeleton class)
    expect(container.querySelectorAll(".animate-pulse, [data-slot='skeleton']").length).toBeGreaterThan(0);
  });

  it("renders 'No team' when ticket has no team", () => {
    const ticket = toTicketListItem({ team: null });
    render(<TicketTable tickets={[ticket]} />);
    expect(screen.getByText("No team")).toBeInTheDocument();
  });

  it("renders team name when assigned to a team", () => {
    const ticket = toTicketListItem({
      team: { id: "team-1", name: "Alpha Squad" },
    });
    render(<TicketTable tickets={[ticket]} />);
    expect(screen.getByText("Alpha Squad")).toBeInTheDocument();
  });
});
