import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PageHeader } from "@/components/shared/page-header";

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="My Page" />);
    expect(screen.getByRole("heading", { name: "My Page" })).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<PageHeader title="Tickets" description="Manage all support tickets" />);
    expect(screen.getByText("Manage all support tickets")).toBeInTheDocument();
  });

  it("does not render description element when description is omitted", () => {
    render(<PageHeader title="Tickets" />);
    expect(screen.queryByText(/manage/i)).not.toBeInTheDocument();
  });

  it("renders action buttons when provided", () => {
    render(
      <PageHeader
        title="Tickets"
        actions={<button>Create Ticket</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Create Ticket" })).toBeInTheDocument();
  });

  it("does not render the actions container when actions prop is omitted", () => {
    const { container } = render(<PageHeader title="Tickets" />);
    // No button should be rendered
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });

  it("applies a custom className", () => {
    const { container } = render(
      <PageHeader title="Tickets" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
