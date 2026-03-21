import { http, HttpResponse } from "msw";
import {
  createMockNotification,
  createMockTicket,
} from "../factories";

const mockTickets = [
  createMockTicket({ id: "ticket-1", number: 1, title: "First ticket" }),
  createMockTicket({ id: "ticket-2", number: 2, title: "Second ticket" }),
];

export const handlers = [
  // GET /api/tickets
  http.get("/api/tickets", () => {
    return HttpResponse.json({
      success: true,
      data: {
        tickets: mockTickets,
        total: mockTickets.length,
        page: 1,
        totalPages: 1,
      },
    });
  }),

  // POST /api/tickets
  http.post("/api/tickets", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const ticket = createMockTicket({
      title: body.title as string,
      description: body.description as string,
    });
    return HttpResponse.json(
      { success: true, data: ticket, message: "Ticket created successfully" },
      { status: 201 }
    );
  }),

  // GET /api/tickets/:id
  http.get("/api/tickets/:id", ({ params }) => {
    const ticket = createMockTicket({ id: params.id as string });
    return HttpResponse.json({ success: true, data: ticket });
  }),

  // PUT /api/tickets/:id
  http.put("/api/tickets/:id", async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const ticket = createMockTicket({ id: params.id as string, ...body });
    return HttpResponse.json({ success: true, data: ticket });
  }),

  // GET /api/notifications
  http.get("/api/notifications", () => {
    const notifications = [
      createMockNotification({ id: "notif-1", isRead: false }),
      createMockNotification({ id: "notif-2", isRead: true }),
    ];
    return HttpResponse.json({ success: true, data: notifications });
  }),

  // POST /api/notifications/read
  http.post("/api/notifications/read", () => {
    return HttpResponse.json({ success: true, data: null });
  }),

  // GET /api/analytics/overview
  http.get("/api/analytics/overview", () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalTickets: 42,
        openTickets: 15,
        resolvedToday: 7,
        avgResolutionTime: 3.5,
        satisfactionScore: 4.2,
      },
    });
  }),
];
