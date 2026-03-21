import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Cleaning database...");
  await prisma.automationExecution.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.canvasData.deleteMany();
  await prisma.aIPredictionLog.deleteMany();
  await prisma.aIProviderConfig.deleteMany();
  await prisma.sLABreach.deleteMany();
  await prisma.sLAPolicy.deleteMany();
  await prisma.channelMessage.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.kBArticle.deleteMany();
  await prisma.kBCategory.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskChecklist.deleteMany();
  await prisma.task.deleteMany();
  await prisma.workflowSnapshot.deleteMany();
  await prisma.workflowInstanceStep.deleteMany();
  await prisma.workflowInstance.deleteMany();
  await prisma.workflowTransition.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflowTemplate.deleteMany();
  await prisma.ticketRelation.deleteMany();
  await prisma.ticketWatcher.deleteMany();
  await prisma.ticketTagRelation.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.ticketTag.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.user.deleteMany();
  console.log("Database cleaned.");

  console.log("Seeding users...");
  const pw = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@taskmanager.com", hashedPassword: pw, role: "ADMIN", emailVerified: new Date(), createdAt: daysAgo(90) },
  });
  const manager1 = await prisma.user.create({
    data: { name: "Sarah Chen", email: "sarah@taskmanager.com", hashedPassword: pw, role: "MANAGER", emailVerified: new Date(), createdAt: daysAgo(85) },
  });
  const manager2 = await prisma.user.create({
    data: { name: "Marcus Weber", email: "marcus@taskmanager.com", hashedPassword: pw, role: "MANAGER", emailVerified: new Date(), createdAt: daysAgo(80) },
  });
  const agent1 = await prisma.user.create({
    data: { name: "Emily Rodriguez", email: "emily@taskmanager.com", hashedPassword: pw, role: "AGENT", emailVerified: new Date(), createdAt: daysAgo(75) },
  });
  const agent2 = await prisma.user.create({
    data: { name: "James Park", email: "james@taskmanager.com", hashedPassword: pw, role: "AGENT", emailVerified: new Date(), createdAt: daysAgo(70) },
  });
  const agent3 = await prisma.user.create({
    data: { name: "Lisa Müller", email: "lisa@taskmanager.com", hashedPassword: pw, role: "AGENT", emailVerified: new Date(), createdAt: daysAgo(65) },
  });
  const agent4 = await prisma.user.create({
    data: { name: "David Kim", email: "david@taskmanager.com", hashedPassword: pw, role: "AGENT", emailVerified: new Date(), createdAt: daysAgo(60) },
  });
  const customer1 = await prisma.user.create({
    data: { name: "Anna Schmidt", email: "anna@example.com", hashedPassword: pw, role: "CUSTOMER", emailVerified: new Date(), createdAt: daysAgo(50) },
  });
  const customer2 = await prisma.user.create({
    data: { name: "Tom Baker", email: "tom@example.com", hashedPassword: pw, role: "CUSTOMER", emailVerified: new Date(), createdAt: daysAgo(45) },
  });
  const customer3 = await prisma.user.create({
    data: { name: "Maria Garcia", email: "maria@example.com", hashedPassword: pw, role: "CUSTOMER", emailVerified: new Date(), createdAt: daysAgo(30) },
  });
  console.log("Created 10 users");

  const agents = [admin, manager1, manager2, agent1, agent2, agent3, agent4];
  const customers = [customer1, customer2, customer3];

  console.log("Seeding teams...");
  const engineering = await prisma.team.create({ data: { name: "Engineering", description: "Software engineering and development" } });
  const support = await prisma.team.create({ data: { name: "Customer Support", description: "Frontline customer support and helpdesk" } });
  const infra = await prisma.team.create({ data: { name: "Infrastructure", description: "DevOps, cloud, and infrastructure" } });

  await prisma.teamMember.createMany({
    data: [
      { userId: admin.id, teamId: engineering.id, role: "LEAD" },
      { userId: manager1.id, teamId: support.id, role: "LEAD" },
      { userId: manager2.id, teamId: engineering.id, role: "MEMBER" },
      { userId: agent1.id, teamId: support.id, role: "MEMBER" },
      { userId: agent2.id, teamId: engineering.id, role: "MEMBER" },
      { userId: agent3.id, teamId: support.id, role: "MEMBER" },
      { userId: agent4.id, teamId: infra.id, role: "LEAD" },
      { userId: manager2.id, teamId: infra.id, role: "MEMBER" },
    ],
  });
  console.log("Created 3 teams with members");

  console.log("Seeding tags...");
  const tags = await Promise.all([
    prisma.ticketTag.create({ data: { name: "Bug", color: "#EF4444" } }),
    prisma.ticketTag.create({ data: { name: "Feature", color: "#3B82F6" } }),
    prisma.ticketTag.create({ data: { name: "Urgent", color: "#F59E0B" } }),
    prisma.ticketTag.create({ data: { name: "Documentation", color: "#8B5CF6" } }),
    prisma.ticketTag.create({ data: { name: "Enhancement", color: "#10B981" } }),
    prisma.ticketTag.create({ data: { name: "Performance", color: "#F97316" } }),
    prisma.ticketTag.create({ data: { name: "Security", color: "#DC2626" } }),
    prisma.ticketTag.create({ data: { name: "UI/UX", color: "#EC4899" } }),
  ]);
  console.log("Created 8 tags");

  console.log("Seeding tickets...");
  const ticketData = [
    { title: "Login page crashes on Safari", description: "Users report that the login page throws a blank white screen when accessing from Safari 17.x on macOS Sonoma. Console shows a TypeError related to the form validation library. This is blocking several enterprise customers.", status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, category: "Bug", channel: "EMAIL" as const, createdById: customer1.id, assignedToId: agent2.id, teamId: engineering.id, dueDate: daysAgo(-2), createdAt: daysAgo(5), tagIndices: [0, 2] },
    { title: "Add dark mode support to dashboard", description: "Multiple users have requested a dark mode option for the main dashboard. This should follow the system preference and allow manual override. Consider using CSS custom properties for theming.", status: "OPEN" as const, priority: "HIGH" as const, category: "Feature Request", channel: "WEB" as const, createdById: customer2.id, assignedToId: agent1.id, teamId: engineering.id, dueDate: daysAgo(-7), createdAt: daysAgo(12), tagIndices: [1, 7] },
    { title: "Database connection timeout during peak hours", description: "The application experiences intermittent database connection timeouts between 9-11 AM UTC when user traffic peaks. Connection pool seems to be exhausted. Need to investigate pool size configuration and possibly implement connection retry logic.", status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, category: "Infrastructure", channel: "API" as const, createdById: admin.id, assignedToId: agent4.id, teamId: infra.id, dueDate: daysAgo(-1), createdAt: daysAgo(3), tagIndices: [0, 5, 6] },
    { title: "Export reports to PDF format", description: "Need the ability to export analytics reports and ticket summaries to PDF format. Should include charts, tables, and support for custom date ranges.", status: "OPEN" as const, priority: "MEDIUM" as const, category: "Feature Request", channel: "CHAT" as const, createdById: customer3.id, assignedToId: null, teamId: engineering.id, dueDate: daysAgo(-14), createdAt: daysAgo(20), tagIndices: [1] },
    { title: "Email notifications not being sent", description: "Since the last deployment, email notifications for ticket updates are not being delivered. The email service logs show connection refused errors to the SMTP server. This affects all notification types.", status: "RESOLVED" as const, priority: "HIGH" as const, category: "Bug", channel: "PHONE" as const, createdById: customer1.id, assignedToId: agent3.id, teamId: support.id, resolvedAt: daysAgo(1), createdAt: daysAgo(4), tagIndices: [0, 2] },
    { title: "Improve search performance for large datasets", description: "The ticket search becomes very slow when the database has more than 10,000 tickets. Need to implement full-text search indexing and optimize the query execution plan.", status: "IN_PROGRESS" as const, priority: "HIGH" as const, category: "Performance", channel: "WEB" as const, createdById: manager2.id, assignedToId: agent2.id, teamId: engineering.id, dueDate: daysAgo(-5), createdAt: daysAgo(8), tagIndices: [4, 5] },
    { title: "User avatar upload fails with large files", description: "When uploading profile pictures larger than 2MB, the upload silently fails without any error message. Should add proper file size validation and show a meaningful error to the user.", status: "OPEN" as const, priority: "LOW" as const, category: "Bug", channel: "WEB" as const, createdById: customer2.id, assignedToId: agent1.id, teamId: support.id, createdAt: daysAgo(15), tagIndices: [0, 7] },
    { title: "Implement SSO with SAML 2.0", description: "Enterprise customers need SAML 2.0 SSO integration. Should support common identity providers like Okta, Azure AD, and OneLogin. Must include SP metadata endpoint and ACS URL configuration.", status: "OPEN" as const, priority: "HIGH" as const, category: "Feature Request", channel: "EMAIL" as const, createdById: manager1.id, assignedToId: null, teamId: engineering.id, dueDate: daysAgo(-30), createdAt: daysAgo(25), tagIndices: [1, 6] },
    { title: "Fix timezone display in ticket timestamps", description: "Ticket timestamps show UTC time instead of the user's local timezone. This causes confusion when coordinating across teams in different regions.", status: "RESOLVED" as const, priority: "MEDIUM" as const, category: "Bug", channel: "CHAT" as const, createdById: agent1.id, assignedToId: agent2.id, teamId: engineering.id, resolvedAt: daysAgo(2), createdAt: daysAgo(10), tagIndices: [0] },
    { title: "Add bulk ticket actions", description: "Support agents need the ability to select multiple tickets and perform bulk actions: change status, assign, add tags, or merge tickets.", status: "WAITING" as const, priority: "MEDIUM" as const, category: "Feature Request", channel: "WEB" as const, createdById: agent3.id, assignedToId: agent1.id, teamId: support.id, createdAt: daysAgo(18), tagIndices: [1, 4] },
    { title: "API rate limiting not working correctly", description: "The API rate limiter is not properly counting requests per client. Some clients exceed the limit without being throttled while legitimate traffic gets blocked.", status: "IN_PROGRESS" as const, priority: "HIGH" as const, category: "Bug", channel: "API" as const, createdById: agent4.id, assignedToId: agent4.id, teamId: infra.id, dueDate: daysAgo(-3), createdAt: daysAgo(6), tagIndices: [0, 6] },
    { title: "Create onboarding tutorial for new users", description: "New users need a guided onboarding experience that walks them through creating their first ticket, navigating the dashboard, and configuring notifications.", status: "OPEN" as const, priority: "MEDIUM" as const, category: "Documentation", channel: "WEB" as const, createdById: manager1.id, assignedToId: agent1.id, teamId: support.id, createdAt: daysAgo(22), tagIndices: [3, 7] },
    { title: "Mobile responsive layout broken on tablets", description: "The sidebar navigation overlaps with the main content area on iPad and Android tablets in portrait mode. The breakpoint handling needs adjustment.", status: "OPEN" as const, priority: "MEDIUM" as const, category: "Bug", channel: "WHATSAPP" as const, createdById: customer3.id, assignedToId: agent2.id, teamId: engineering.id, createdAt: daysAgo(9), tagIndices: [0, 7] },
    { title: "Webhook delivery failures for external integrations", description: "Outgoing webhooks to third-party services (Slack, Teams, Jira) are failing intermittently with timeout errors. Need to implement retry logic with exponential backoff.", status: "RESOLVED" as const, priority: "HIGH" as const, category: "Infrastructure", channel: "API" as const, createdById: agent4.id, assignedToId: agent4.id, teamId: infra.id, resolvedAt: daysAgo(3), createdAt: daysAgo(7), tagIndices: [0, 5] },
    { title: "Implement custom ticket fields", description: "Different departments need custom fields on tickets. For example, Sales needs 'Deal Size' and Engineering needs 'Component'. Should support text, number, dropdown, and date field types.", status: "OPEN" as const, priority: "LOW" as const, category: "Feature Request", channel: "EMAIL" as const, createdById: manager2.id, assignedToId: null, teamId: engineering.id, dueDate: daysAgo(-21), createdAt: daysAgo(28), tagIndices: [1] },
    { title: "Password reset email contains broken link", description: "The password reset email sends a link with an incorrect domain. The link points to localhost instead of the production URL.", status: "CLOSED" as const, priority: "CRITICAL" as const, category: "Bug", channel: "PHONE" as const, createdById: customer1.id, assignedToId: agent3.id, teamId: support.id, resolvedAt: daysAgo(14), closedAt: daysAgo(13), createdAt: daysAgo(16), tagIndices: [0, 2, 6] },
    { title: "Add keyboard shortcuts for common actions", description: "Power users want keyboard shortcuts for navigating between tickets (j/k), changing status (s), assigning (a), and opening the command palette (Cmd+K).", status: "WAITING" as const, priority: "LOW" as const, category: "Enhancement", channel: "WEB" as const, createdById: agent2.id, assignedToId: agent2.id, teamId: engineering.id, createdAt: daysAgo(11), tagIndices: [4, 7] },
    { title: "Redis cache inconsistency after deployments", description: "After each deployment, the Redis cache contains stale data for user sessions and ticket counts. Need to implement cache invalidation strategy during deployment pipeline.", status: "IN_PROGRESS" as const, priority: "HIGH" as const, category: "Infrastructure", channel: "SOCIAL" as const, createdById: agent4.id, assignedToId: agent4.id, teamId: infra.id, dueDate: daysAgo(-2), createdAt: daysAgo(4), tagIndices: [5, 6] },
    { title: "Customer satisfaction survey integration", description: "After a ticket is resolved, automatically send a CSAT survey to the customer. Track results per agent and team. Include NPS score calculation.", status: "OPEN" as const, priority: "MEDIUM" as const, category: "Feature Request", channel: "EMAIL" as const, createdById: manager1.id, assignedToId: null, teamId: support.id, createdAt: daysAgo(19), tagIndices: [1] },
    { title: "Update API documentation for v2 endpoints", description: "The API docs are outdated and don't reflect the v2 changes. Need to update all endpoint descriptions, request/response examples, and authentication requirements.", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, category: "Documentation", channel: "WEB" as const, createdById: admin.id, assignedToId: agent1.id, teamId: support.id, createdAt: daysAgo(6), tagIndices: [3] },
    { title: "Memory leak in real-time notification service", description: "The WebSocket notification service leaks memory over time. After ~48 hours of continuous operation, memory usage grows from 256MB to 2GB. Suspect event listener cleanup issue.", status: "OPEN" as const, priority: "CRITICAL" as const, category: "Bug", channel: "API" as const, createdById: agent4.id, assignedToId: agent4.id, teamId: infra.id, dueDate: daysAgo(-1), createdAt: daysAgo(2), tagIndices: [0, 2, 5] },
    { title: "Localization support for German and Spanish", description: "Need to add i18n support starting with German (de) and Spanish (es). All UI strings should be externalized and translation files provided.", status: "OPEN" as const, priority: "LOW" as const, category: "Feature Request", channel: "WEB" as const, createdById: customer3.id, assignedToId: null, teamId: engineering.id, createdAt: daysAgo(17), tagIndices: [1] },
  ];

  const tickets = [];
  for (const t of ticketData) {
    const { tagIndices, ...data } = t;
    const ticket = await prisma.ticket.create({ data });
    if (tagIndices.length) {
      await prisma.ticketTagRelation.createMany({
        data: tagIndices.map((i) => ({ ticketId: ticket.id, tagId: tags[i].id })),
      });
    }
    tickets.push(ticket);
  }
  console.log(`Created ${tickets.length} tickets with tags`);

  console.log("Seeding ticket comments...");
  const commentData = [
    { ticketId: tickets[0].id, userId: agent2.id, content: "I've been able to reproduce this on Safari 17.4. The issue is in the form validation library — it uses a Proxy API feature that Safari handles differently. Working on a polyfill fix.", isInternal: false, createdAt: daysAgo(4) },
    { ticketId: tickets[0].id, userId: admin.id, content: "This is affecting 3 enterprise customers. Please prioritize.", isInternal: true, createdAt: daysAgo(4) },
    { ticketId: tickets[0].id, userId: agent2.id, content: "Fix deployed to staging. Can someone verify on a real Safari device?", isInternal: false, createdAt: daysAgo(2) },
    { ticketId: tickets[2].id, userId: agent4.id, content: "Increased connection pool from 10 to 25. Monitoring the situation. Also adding connection retry with backoff.", isInternal: false, createdAt: daysAgo(2) },
    { ticketId: tickets[2].id, userId: manager2.id, content: "Should we also look into read replicas for the reporting queries?", isInternal: true, createdAt: daysAgo(1) },
    { ticketId: tickets[4].id, userId: agent3.id, content: "Found the issue — the SMTP credentials were rotated during the last deployment but the environment variables weren't updated. Fixed and notifications are flowing again.", isInternal: false, createdAt: daysAgo(2) },
    { ticketId: tickets[4].id, userId: customer1.id, content: "Confirmed, I'm receiving emails again. Thank you!", isInternal: false, createdAt: daysAgo(1) },
    { ticketId: tickets[5].id, userId: agent2.id, content: "Implemented PostgreSQL full-text search with tsvector. Initial tests show 95% faster queries on 50k+ datasets.", isInternal: false, createdAt: daysAgo(3) },
    { ticketId: tickets[8].id, userId: agent2.id, content: "The timezone issue was in our date formatting utility. Now using Intl.DateTimeFormat with the user's timezone preference.", isInternal: false, createdAt: daysAgo(3) },
    { ticketId: tickets[10].id, userId: agent4.id, content: "Found the root cause: the rate limiter was using the proxy IP instead of X-Forwarded-For header. Deployed fix to staging.", isInternal: false, createdAt: daysAgo(3) },
    { ticketId: tickets[13].id, userId: agent4.id, content: "Added retry logic with exponential backoff (3 attempts, 1s/4s/16s delays). Also added dead letter queue for permanently failed deliveries.", isInternal: false, createdAt: daysAgo(4) },
    { ticketId: tickets[15].id, userId: agent3.id, content: "The broken link was caused by a misconfigured NEXT_PUBLIC_URL in the production .env. Updated and redeployed. Sent test reset email successfully.", isInternal: false, createdAt: daysAgo(15) },
    { ticketId: tickets[1].id, userId: agent1.id, content: "I've started the design mockups for dark mode. Will share Figma link soon.", isInternal: false, createdAt: daysAgo(8) },
    { ticketId: tickets[9].id, userId: agent1.id, content: "Waiting on UX designs for the bulk action toolbar. @Sarah can you check with the design team?", isInternal: true, createdAt: daysAgo(10) },
  ];
  await prisma.ticketComment.createMany({ data: commentData });
  console.log(`Created ${commentData.length} comments`);

  console.log("Seeding ticket history...");
  const historyData = [
    { ticketId: tickets[0].id, userId: admin.id, action: "status_changed", field: "status", oldValue: "OPEN", newValue: "IN_PROGRESS", createdAt: daysAgo(4) },
    { ticketId: tickets[0].id, userId: admin.id, action: "assigned", field: "assignedToId", oldValue: null, newValue: agent2.name, createdAt: daysAgo(5) },
    { ticketId: tickets[2].id, userId: manager2.id, action: "status_changed", field: "status", oldValue: "OPEN", newValue: "IN_PROGRESS", createdAt: daysAgo(2) },
    { ticketId: tickets[4].id, userId: agent3.id, action: "status_changed", field: "status", oldValue: "IN_PROGRESS", newValue: "RESOLVED", createdAt: daysAgo(1) },
    { ticketId: tickets[5].id, userId: agent2.id, action: "priority_changed", field: "priority", oldValue: "MEDIUM", newValue: "HIGH", createdAt: daysAgo(7) },
    { ticketId: tickets[8].id, userId: agent2.id, action: "status_changed", field: "status", oldValue: "IN_PROGRESS", newValue: "RESOLVED", createdAt: daysAgo(2) },
    { ticketId: tickets[15].id, userId: agent3.id, action: "status_changed", field: "status", oldValue: "RESOLVED", newValue: "CLOSED", createdAt: daysAgo(13) },
    { ticketId: tickets[13].id, userId: agent4.id, action: "status_changed", field: "status", oldValue: "IN_PROGRESS", newValue: "RESOLVED", createdAt: daysAgo(3) },
  ];
  await prisma.ticketHistory.createMany({ data: historyData });
  console.log(`Created ${historyData.length} history entries`);

  console.log("Seeding tasks...");
  const taskData = [
    { title: "Set up Safari testing environment", status: "IN_PROGRESS" as const, priority: "HIGH" as const, ticketId: tickets[0].id, createdById: agent2.id, assignedToId: agent2.id, dueDate: daysAgo(-1), estimatedHours: 4, createdAt: daysAgo(4) },
    { title: "Write Safari polyfill for Proxy API", status: "TODO" as const, priority: "HIGH" as const, ticketId: tickets[0].id, createdById: agent2.id, assignedToId: agent2.id, dueDate: daysAgo(-1), estimatedHours: 8, createdAt: daysAgo(3) },
    { title: "Create dark mode color palette", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, ticketId: tickets[1].id, createdById: agent1.id, assignedToId: agent1.id, dueDate: daysAgo(-5), estimatedHours: 6, createdAt: daysAgo(10) },
    { title: "Implement CSS variables for theming", status: "TODO" as const, priority: "MEDIUM" as const, ticketId: tickets[1].id, createdById: agent1.id, assignedToId: agent2.id, dueDate: daysAgo(-7), estimatedHours: 12, createdAt: daysAgo(10) },
    { title: "Increase connection pool size", status: "DONE" as const, priority: "CRITICAL" as const, ticketId: tickets[2].id, createdById: agent4.id, assignedToId: agent4.id, estimatedHours: 2, completedAt: daysAgo(2), createdAt: daysAgo(3) },
    { title: "Add connection retry logic", status: "IN_PROGRESS" as const, priority: "HIGH" as const, ticketId: tickets[2].id, createdById: agent4.id, assignedToId: agent4.id, estimatedHours: 6, createdAt: daysAgo(2) },
    { title: "Implement full-text search indexing", status: "IN_REVIEW" as const, priority: "HIGH" as const, ticketId: tickets[5].id, createdById: agent2.id, assignedToId: agent2.id, estimatedHours: 16, createdAt: daysAgo(7) },
    { title: "Optimize ticket list query", status: "DONE" as const, priority: "MEDIUM" as const, ticketId: tickets[5].id, createdById: agent2.id, assignedToId: agent2.id, estimatedHours: 4, completedAt: daysAgo(5), createdAt: daysAgo(7) },
    { title: "Write API v2 authentication docs", status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, ticketId: tickets[19].id, createdById: agent1.id, assignedToId: agent1.id, estimatedHours: 8, createdAt: daysAgo(5) },
    { title: "Update endpoint examples", status: "TODO" as const, priority: "MEDIUM" as const, ticketId: tickets[19].id, createdById: agent1.id, assignedToId: agent1.id, estimatedHours: 10, createdAt: daysAgo(5) },
    { title: "Fix rate limiter IP detection", status: "DONE" as const, priority: "HIGH" as const, ticketId: tickets[10].id, createdById: agent4.id, assignedToId: agent4.id, estimatedHours: 3, completedAt: daysAgo(4), createdAt: daysAgo(5) },
    { title: "Add rate limit headers to responses", status: "DONE" as const, priority: "MEDIUM" as const, ticketId: tickets[10].id, createdById: agent4.id, assignedToId: agent4.id, estimatedHours: 2, completedAt: daysAgo(3), createdAt: daysAgo(5) },
    { title: "Research SAML 2.0 libraries", status: "TODO" as const, priority: "MEDIUM" as const, ticketId: tickets[7].id, createdById: admin.id, assignedToId: null, estimatedHours: 4, createdAt: daysAgo(20) },
    { title: "Set up monitoring dashboard for Redis", status: "IN_PROGRESS" as const, priority: "HIGH" as const, ticketId: tickets[17].id, createdById: agent4.id, assignedToId: agent4.id, estimatedHours: 5, createdAt: daysAgo(3) },
    { title: "Weekly team standup notes", status: "DONE" as const, priority: "LOW" as const, createdById: manager1.id, assignedToId: manager1.id, completedAt: daysAgo(1), createdAt: daysAgo(7) },
    { title: "Review Q1 support metrics", status: "IN_REVIEW" as const, priority: "MEDIUM" as const, createdById: manager1.id, assignedToId: manager1.id, dueDate: daysAgo(-3), createdAt: daysAgo(10) },
    { title: "Onboard new team member (David)", status: "DONE" as const, priority: "HIGH" as const, createdById: admin.id, assignedToId: manager2.id, completedAt: daysAgo(30), createdAt: daysAgo(60) },
    { title: "Prepare incident post-mortem for DB outage", status: "TODO" as const, priority: "HIGH" as const, ticketId: tickets[2].id, createdById: manager2.id, assignedToId: agent4.id, dueDate: daysAgo(-5), estimatedHours: 3, createdAt: daysAgo(2) },
  ];

  const tasks = [];
  for (const t of taskData) {
    tasks.push(await prisma.task.create({ data: t }));
  }
  console.log(`Created ${tasks.length} tasks`);

  const checklistData = [
    { taskId: tasks[0].id, title: "Install Safari on test machine", isCompleted: true, order: 0 },
    { taskId: tasks[0].id, title: "Configure BrowserStack for Safari 17.x", isCompleted: true, order: 1 },
    { taskId: tasks[0].id, title: "Reproduce the bug", isCompleted: true, order: 2 },
    { taskId: tasks[0].id, title: "Document reproduction steps", isCompleted: false, order: 3 },
    { taskId: tasks[2].id, title: "Audit current color usage", isCompleted: true, order: 0 },
    { taskId: tasks[2].id, title: "Create dark palette variants", isCompleted: true, order: 1 },
    { taskId: tasks[2].id, title: "Test contrast ratios (WCAG AA)", isCompleted: false, order: 2 },
    { taskId: tasks[2].id, title: "Get design approval", isCompleted: false, order: 3 },
    { taskId: tasks[6].id, title: "Add tsvector column to tickets", isCompleted: true, order: 0 },
    { taskId: tasks[6].id, title: "Create GIN index", isCompleted: true, order: 1 },
    { taskId: tasks[6].id, title: "Update search query to use FTS", isCompleted: true, order: 2 },
    { taskId: tasks[6].id, title: "Benchmark with 50k+ records", isCompleted: false, order: 3 },
    { taskId: tasks[8].id, title: "Document JWT authentication flow", isCompleted: true, order: 0 },
    { taskId: tasks[8].id, title: "Document API key authentication", isCompleted: false, order: 1 },
    { taskId: tasks[8].id, title: "Add code examples (curl, JS, Python)", isCompleted: false, order: 2 },
  ];
  await prisma.taskChecklist.createMany({ data: checklistData });

  await prisma.taskDependency.create({ data: { taskId: tasks[1].id, dependsOnId: tasks[0].id } });
  await prisma.taskDependency.create({ data: { taskId: tasks[3].id, dependsOnId: tasks[2].id } });
  await prisma.taskDependency.create({ data: { taskId: tasks[9].id, dependsOnId: tasks[8].id } });
  console.log("Created checklists and dependencies");

  console.log("Seeding workflows...");
  const bugWorkflow = await prisma.workflowTemplate.create({
    data: { name: "Bug Resolution", description: "Standard workflow for resolving bug reports", category: "Bug", createdById: admin.id, isActive: true },
  });
  const bugSteps = await Promise.all([
    prisma.workflowStep.create({ data: { templateId: bugWorkflow.id, name: "Triage", description: "Initial assessment and prioritization", order: 0, type: "MANUAL", positionX: 100, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: bugWorkflow.id, name: "Reproduce", description: "Reproduce the reported bug", order: 1, type: "MANUAL", positionX: 350, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: bugWorkflow.id, name: "Fix & Test", description: "Implement fix and write tests", order: 2, type: "MANUAL", positionX: 600, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: bugWorkflow.id, name: "Code Review", description: "Peer review of the fix", order: 3, type: "APPROVAL", positionX: 850, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: bugWorkflow.id, name: "Deploy", description: "Deploy fix to production", order: 4, type: "MANUAL", positionX: 1100, positionY: 200 } }),
  ]);
  await prisma.workflowTransition.createMany({
    data: [
      { templateId: bugWorkflow.id, fromStepId: bugSteps[0].id, toStepId: bugSteps[1].id, label: "Confirmed" },
      { templateId: bugWorkflow.id, fromStepId: bugSteps[1].id, toStepId: bugSteps[2].id, label: "Reproduced" },
      { templateId: bugWorkflow.id, fromStepId: bugSteps[2].id, toStepId: bugSteps[3].id, label: "Ready for review" },
      { templateId: bugWorkflow.id, fromStepId: bugSteps[3].id, toStepId: bugSteps[4].id, label: "Approved" },
    ],
  });

  const featureWorkflow = await prisma.workflowTemplate.create({
    data: { name: "Feature Request Pipeline", description: "End-to-end workflow for feature requests from evaluation to release", category: "Feature", createdById: manager1.id, isActive: true },
  });
  const featureSteps = await Promise.all([
    prisma.workflowStep.create({ data: { templateId: featureWorkflow.id, name: "Evaluate", description: "Assess feasibility and business value", order: 0, type: "MANUAL", positionX: 100, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: featureWorkflow.id, name: "Design", description: "Create technical and UX design", order: 1, type: "MANUAL", positionX: 350, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: featureWorkflow.id, name: "Approve", description: "Manager approval to proceed", order: 2, type: "APPROVAL", positionX: 600, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: featureWorkflow.id, name: "Implement", description: "Development implementation", order: 3, type: "MANUAL", positionX: 850, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: featureWorkflow.id, name: "QA", description: "Quality assurance testing", order: 4, type: "MANUAL", positionX: 1100, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: featureWorkflow.id, name: "Release", description: "Release to production", order: 5, type: "MANUAL", positionX: 1350, positionY: 200 } }),
  ]);
  await prisma.workflowTransition.createMany({
    data: [
      { templateId: featureWorkflow.id, fromStepId: featureSteps[0].id, toStepId: featureSteps[1].id, label: "Feasible" },
      { templateId: featureWorkflow.id, fromStepId: featureSteps[1].id, toStepId: featureSteps[2].id, label: "Design complete" },
      { templateId: featureWorkflow.id, fromStepId: featureSteps[2].id, toStepId: featureSteps[3].id, label: "Approved" },
      { templateId: featureWorkflow.id, fromStepId: featureSteps[3].id, toStepId: featureSteps[4].id, label: "Dev complete" },
      { templateId: featureWorkflow.id, fromStepId: featureSteps[4].id, toStepId: featureSteps[5].id, label: "QA passed" },
    ],
  });

  const onboardWorkflow = await prisma.workflowTemplate.create({
    data: { name: "Customer Onboarding", description: "Onboarding workflow for new customer accounts", category: "Support", createdById: manager1.id, isActive: false },
  });
  const onboardSteps = await Promise.all([
    prisma.workflowStep.create({ data: { templateId: onboardWorkflow.id, name: "Welcome Email", order: 0, type: "AUTOMATIC", positionX: 100, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: onboardWorkflow.id, name: "Account Setup", order: 1, type: "MANUAL", positionX: 350, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: onboardWorkflow.id, name: "Training Call", order: 2, type: "MANUAL", positionX: 600, positionY: 200 } }),
    prisma.workflowStep.create({ data: { templateId: onboardWorkflow.id, name: "Follow-up", order: 3, type: "NOTIFICATION", positionX: 850, positionY: 200 } }),
  ]);
  await prisma.workflowTransition.createMany({
    data: [
      { templateId: onboardWorkflow.id, fromStepId: onboardSteps[0].id, toStepId: onboardSteps[1].id, label: "Sent" },
      { templateId: onboardWorkflow.id, fromStepId: onboardSteps[1].id, toStepId: onboardSteps[2].id, label: "Setup done" },
      { templateId: onboardWorkflow.id, fromStepId: onboardSteps[2].id, toStepId: onboardSteps[3].id, label: "Trained" },
    ],
  });

  const instance1 = await prisma.workflowInstance.create({
    data: { templateId: bugWorkflow.id, ticketId: tickets[0].id, currentStepId: bugSteps[2].id, status: "ACTIVE" },
  });
  await prisma.workflowInstanceStep.createMany({
    data: [
      { instanceId: instance1.id, stepId: bugSteps[0].id, status: "COMPLETED", assignedToId: agent2.id, startedAt: daysAgo(5), completedAt: daysAgo(4) },
      { instanceId: instance1.id, stepId: bugSteps[1].id, status: "COMPLETED", assignedToId: agent2.id, startedAt: daysAgo(4), completedAt: daysAgo(3) },
      { instanceId: instance1.id, stepId: bugSteps[2].id, status: "IN_PROGRESS", assignedToId: agent2.id, startedAt: daysAgo(3) },
      { instanceId: instance1.id, stepId: bugSteps[3].id, status: "PENDING" },
      { instanceId: instance1.id, stepId: bugSteps[4].id, status: "PENDING" },
    ],
  });

  const instance2 = await prisma.workflowInstance.create({
    data: { templateId: featureWorkflow.id, ticketId: tickets[1].id, currentStepId: featureSteps[1].id, status: "ACTIVE" },
  });
  await prisma.workflowInstanceStep.createMany({
    data: [
      { instanceId: instance2.id, stepId: featureSteps[0].id, status: "COMPLETED", assignedToId: manager1.id, startedAt: daysAgo(12), completedAt: daysAgo(10) },
      { instanceId: instance2.id, stepId: featureSteps[1].id, status: "IN_PROGRESS", assignedToId: agent1.id, startedAt: daysAgo(10) },
      { instanceId: instance2.id, stepId: featureSteps[2].id, status: "PENDING" },
      { instanceId: instance2.id, stepId: featureSteps[3].id, status: "PENDING" },
      { instanceId: instance2.id, stepId: featureSteps[4].id, status: "PENDING" },
      { instanceId: instance2.id, stepId: featureSteps[5].id, status: "PENDING" },
    ],
  });

  console.log("Created 3 workflow templates with instances");

  console.log("Seeding SLA policies...");
  const slaPolicies = await Promise.all([
    prisma.sLAPolicy.create({ data: { name: "Critical SLA", description: "For critical priority tickets", conditions: { priority: "CRITICAL" }, responseTimeMin: 15, resolutionMin: 240 } }),
    prisma.sLAPolicy.create({ data: { name: "Standard SLA", description: "For medium and high priority tickets", conditions: { priority: ["HIGH", "MEDIUM"] }, responseTimeMin: 60, resolutionMin: 1440 } }),
    prisma.sLAPolicy.create({ data: { name: "Low Priority SLA", description: "For low priority tickets", conditions: { priority: "LOW" }, responseTimeMin: 480, resolutionMin: 4320 } }),
  ]);
  await prisma.sLABreach.createMany({
    data: [
      { ticketId: tickets[0].id, policyId: slaPolicies[0].id, type: "RESOLUTION", breachedAt: daysAgo(1) },
      { ticketId: tickets[20].id, policyId: slaPolicies[0].id, type: "FIRST_RESPONSE", breachedAt: daysAgo(1) },
    ],
  });
  console.log("Created 3 SLA policies with 2 breaches");

  console.log("Seeding channels...");
  await prisma.channel.createMany({
    data: [
      { type: "EMAIL", name: "Support Email", config: { address: "support@taskmanager.com", imapHost: "imap.taskmanager.com" }, isActive: true },
      { type: "CHAT", name: "Live Chat Widget", config: { widgetId: "chat-widget-001", position: "bottom-right" }, isActive: true },
      { type: "WHATSAPP", name: "WhatsApp Business", config: { phoneNumber: "+49 170 1234567", apiKey: "waba-key-xxx" }, isActive: true },
      { type: "API", name: "REST API", config: { endpoint: "/api/v2/tickets", rateLimit: 100 }, isActive: true },
      { type: "PHONE", name: "Phone Support", config: { number: "+49 30 1234567", hours: "9-18 CET" }, isActive: false },
    ],
  });
  console.log("Created 5 channels");

  console.log("Seeding knowledge base...");
  const kbCats = await Promise.all([
    prisma.kBCategory.create({ data: { name: "Getting Started", description: "Guides for new users", order: 0 } }),
    prisma.kBCategory.create({ data: { name: "Account & Billing", description: "Account management and billing questions", order: 1 } }),
    prisma.kBCategory.create({ data: { name: "API Reference", description: "Technical API documentation", order: 2 } }),
    prisma.kBCategory.create({ data: { name: "Troubleshooting", description: "Common issues and solutions", order: 3 } }),
  ]);

  const articleData = [
    { title: "How to create your first ticket", content: "# Creating Your First Ticket\n\nWelcome to Task Manager! Creating a ticket is easy.\n\n## Steps\n\n1. Click **New Ticket** in the top-right corner\n2. Fill in the title and description\n3. Set the priority level\n4. Optionally assign it to a team or agent\n5. Click **Create**\n\n## Tips\n\n- Use clear, descriptive titles\n- Include steps to reproduce for bugs\n- Attach screenshots when possible\n- Set appropriate priority levels", categoryId: kbCats[0].id, authorId: agent1.id, status: "PUBLISHED" as const, viewCount: 342, helpfulCount: 89 },
    { title: "Understanding ticket priorities", content: "# Ticket Priority Levels\n\n## Critical\nSystem-wide outages or security vulnerabilities. Response within 15 minutes.\n\n## High\nMajor functionality broken for multiple users. Response within 1 hour.\n\n## Medium\nFeature not working as expected, workaround available. Response within 4 hours.\n\n## Low\nMinor issues, cosmetic bugs, feature requests. Response within 24 hours.", categoryId: kbCats[0].id, authorId: agent1.id, status: "PUBLISHED" as const, viewCount: 256, helpfulCount: 67 },
    { title: "How to reset your password", content: "# Password Reset Guide\n\n1. Go to the login page\n2. Click **Forgot Password**\n3. Enter your registered email address\n4. Check your inbox for the reset link\n5. Click the link and set a new password\n\n**Note:** The reset link expires after 24 hours. If you don't receive the email, check your spam folder.", categoryId: kbCats[1].id, authorId: agent3.id, status: "PUBLISHED" as const, viewCount: 523, helpfulCount: 156 },
    { title: "Managing your account settings", content: "# Account Settings\n\nAccess your account settings from the sidebar menu.\n\n## Profile\n- Update your name and avatar\n- Change your email address\n- Set your timezone\n\n## Notifications\n- Configure email notification preferences\n- Set up Slack/Teams integrations\n- Manage notification frequency\n\n## Security\n- Change your password\n- Enable two-factor authentication\n- View active sessions", categoryId: kbCats[1].id, authorId: agent1.id, status: "PUBLISHED" as const, viewCount: 178, helpfulCount: 45 },
    { title: "REST API Authentication", content: "# API Authentication\n\n## API Keys\n\nGenerate an API key from Settings > API.\n\n```bash\ncurl -H \"Authorization: Bearer YOUR_API_KEY\" \\\n  https://api.taskmanager.com/v2/tickets\n```\n\n## JWT Tokens\n\nFor user-based authentication:\n\n```bash\ncurl -X POST https://api.taskmanager.com/v2/auth/token \\\n  -d '{\"email\": \"user@example.com\", \"password\": \"...\" }'\n```\n\n## Rate Limits\n\n- 100 requests per minute per API key\n- 429 status code when exceeded", categoryId: kbCats[2].id, authorId: admin.id, status: "PUBLISHED" as const, viewCount: 412, helpfulCount: 98 },
    { title: "Webhook Integration Guide", content: "# Webhooks\n\nSet up webhooks to receive real-time notifications about ticket events.\n\n## Configuration\n\n1. Go to Settings > Integrations > Webhooks\n2. Add your endpoint URL\n3. Select events to subscribe to\n4. Save and test\n\n## Events\n\n- `ticket.created`\n- `ticket.updated`\n- `ticket.resolved`\n- `comment.added`\n\n## Payload Format\n\n```json\n{\n  \"event\": \"ticket.created\",\n  \"timestamp\": \"2026-03-15T10:30:00Z\",\n  \"data\": { \"ticketId\": \"...\", \"title\": \"...\" }\n}\n```", categoryId: kbCats[2].id, authorId: admin.id, status: "PUBLISHED" as const, viewCount: 189, helpfulCount: 52 },
    { title: "Troubleshooting login issues", content: "# Login Troubleshooting\n\n## Common Issues\n\n### \"Invalid credentials\" error\n- Double-check your email address\n- Try resetting your password\n- Check if Caps Lock is on\n\n### Account locked\n- After 5 failed attempts, accounts are locked for 30 minutes\n- Contact your administrator for immediate unlock\n\n### SSO not working\n- Verify your SSO provider is configured correctly\n- Clear browser cookies and try again\n- Check if your account has SSO enabled", categoryId: kbCats[3].id, authorId: agent3.id, status: "PUBLISHED" as const, viewCount: 634, helpfulCount: 201 },
    { title: "Email notifications not arriving", content: "# Email Notification Troubleshooting\n\n## Check These First\n\n1. **Spam/Junk folder** — Check if our emails are being filtered\n2. **Email address** — Verify your email in Account Settings\n3. **Notification settings** — Make sure notifications are enabled\n\n## Still Not Working?\n\n- Add `noreply@taskmanager.com` to your contacts\n- Check with your IT team for email filtering rules\n- Contact support with your email address and we'll investigate", categoryId: kbCats[3].id, authorId: agent3.id, status: "PUBLISHED" as const, viewCount: 298, helpfulCount: 87 },
    { title: "Bulk operations API (Draft)", content: "# Bulk Operations API\n\n*This document is a draft for the upcoming v3 API.*\n\n## Endpoints\n\n- POST /api/v3/tickets/bulk-update\n- POST /api/v3/tickets/bulk-assign\n- POST /api/v3/tickets/bulk-close\n\n## Request Format\n\n```json\n{\n  \"ticketIds\": [\"id1\", \"id2\"],\n  \"action\": \"update\",\n  \"fields\": { \"status\": \"CLOSED\" }\n}\n```", categoryId: kbCats[2].id, authorId: admin.id, status: "DRAFT" as const, viewCount: 12, helpfulCount: 0 },
    { title: "Legacy SOAP API (Deprecated)", content: "# SOAP API Reference\n\nThis API has been deprecated in favor of the REST API v2.", categoryId: kbCats[2].id, authorId: admin.id, status: "ARCHIVED" as const, viewCount: 45, helpfulCount: 2 },
  ];
  for (const a of articleData) {
    await prisma.kBArticle.create({ data: a });
  }
  console.log(`Created ${articleData.length} KB articles in ${kbCats.length} categories`);

  console.log("Seeding badges and awards...");
  const badges = await Promise.all([
    prisma.badge.create({ data: { name: "First Ticket", description: "Resolved your first ticket", icon: "trophy", criteria: { type: "tickets_resolved", count: 1 } } }),
    prisma.badge.create({ data: { name: "Speed Demon", description: "Resolved a ticket within 30 minutes", icon: "zap", criteria: { type: "fast_resolution", minutes: 30 } } }),
    prisma.badge.create({ data: { name: "Team Player", description: "Collaborated on 10 different tickets", icon: "users", criteria: { type: "collaborations", count: 10 } } }),
    prisma.badge.create({ data: { name: "Bug Hunter", description: "Resolved 10 bug tickets", icon: "bug", criteria: { type: "bugs_resolved", count: 10 } } }),
    prisma.badge.create({ data: { name: "Knowledge Sharer", description: "Published 5 knowledge base articles", icon: "book-open", criteria: { type: "articles_published", count: 5 } } }),
    prisma.badge.create({ data: { name: "Marathon Runner", description: "Resolved 50 tickets total", icon: "medal", criteria: { type: "tickets_resolved", count: 50 } } }),
  ]);
  await prisma.userBadge.createMany({
    data: [
      { userId: agent2.id, badgeId: badges[0].id, earnedAt: daysAgo(40) },
      { userId: agent2.id, badgeId: badges[1].id, earnedAt: daysAgo(20) },
      { userId: agent2.id, badgeId: badges[3].id, earnedAt: daysAgo(10) },
      { userId: agent4.id, badgeId: badges[0].id, earnedAt: daysAgo(35) },
      { userId: agent4.id, badgeId: badges[1].id, earnedAt: daysAgo(15) },
      { userId: agent1.id, badgeId: badges[0].id, earnedAt: daysAgo(50) },
      { userId: agent1.id, badgeId: badges[4].id, earnedAt: daysAgo(25) },
      { userId: agent3.id, badgeId: badges[0].id, earnedAt: daysAgo(45) },
      { userId: agent3.id, badgeId: badges[2].id, earnedAt: daysAgo(18) },
      { userId: admin.id, badgeId: badges[0].id, earnedAt: daysAgo(80) },
      { userId: admin.id, badgeId: badges[4].id, earnedAt: daysAgo(60) },
      { userId: admin.id, badgeId: badges[5].id, earnedAt: daysAgo(30) },
    ],
  });
  console.log("Created 6 badges with 12 awards");

  console.log("Seeding notifications...");
  const notifData = [
    { userId: admin.id, type: "TICKET_ASSIGNED" as const, title: "New critical ticket", message: "Memory leak in real-time notification service has been assigned to David Kim", link: `/tickets/${tickets[20].id}`, createdAt: daysAgo(2) },
    { userId: admin.id, type: "SLA_BREACH" as const, title: "SLA breach detected", message: "Ticket #1 (Login page crashes on Safari) has breached resolution SLA", link: `/tickets/${tickets[0].id}`, createdAt: daysAgo(1) },
    { userId: admin.id, type: "TICKET_COMMENT" as const, title: "New comment on ticket", message: "James Park commented on Login page crashes on Safari", link: `/tickets/${tickets[0].id}`, createdAt: daysAgo(2) },
    { userId: admin.id, type: "SYSTEM" as const, title: "Weekly report ready", message: "Your weekly analytics report for the last 7 days is ready to view", link: "/analytics", createdAt: daysAgo(1) },
    { userId: admin.id, type: "TICKET_UPDATED" as const, title: "Ticket resolved", message: "Email notifications not being sent has been resolved by Lisa Müller", link: `/tickets/${tickets[4].id}`, createdAt: daysAgo(1), isRead: true },
    { userId: admin.id, type: "TASK_DUE" as const, title: "Task overdue", message: "Prepare incident post-mortem for DB outage is past due date", link: `/tasks/${tasks[17].id}`, createdAt: hoursAgo(6) },
    { userId: agent2.id, type: "TICKET_ASSIGNED" as const, title: "Ticket assigned to you", message: "Login page crashes on Safari has been assigned to you", link: `/tickets/${tickets[0].id}`, createdAt: daysAgo(5) },
    { userId: agent2.id, type: "TICKET_COMMENT" as const, title: "Admin commented", message: "Admin User left an internal note on Login page crashes on Safari", link: `/tickets/${tickets[0].id}`, createdAt: daysAgo(4) },
    { userId: agent1.id, type: "TICKET_ASSIGNED" as const, title: "Ticket assigned to you", message: "Add dark mode support has been assigned to you", link: `/tickets/${tickets[1].id}`, createdAt: daysAgo(12) },
    { userId: agent4.id, type: "SLA_WARNING" as const, title: "SLA warning", message: "Database connection timeout ticket is approaching SLA deadline", link: `/tickets/${tickets[2].id}`, createdAt: daysAgo(2) },
    { userId: manager1.id, type: "SYSTEM" as const, title: "New team member", message: "David Kim has joined the Infrastructure team", createdAt: daysAgo(60) },
  ];
  await prisma.notification.createMany({ data: notifData });
  console.log(`Created ${notifData.length} notifications`);

  console.log("Seeding ticket watchers and relations...");
  await prisma.ticketWatcher.createMany({
    data: [
      { ticketId: tickets[0].id, userId: admin.id },
      { ticketId: tickets[0].id, userId: manager2.id },
      { ticketId: tickets[2].id, userId: admin.id },
      { ticketId: tickets[2].id, userId: manager2.id },
      { ticketId: tickets[5].id, userId: manager2.id },
      { ticketId: tickets[1].id, userId: manager1.id },
    ],
  });
  await prisma.ticketRelation.createMany({
    data: [
      { sourceTicketId: tickets[0].id, targetTicketId: tickets[12].id, type: "RELATED" },
      { sourceTicketId: tickets[2].id, targetTicketId: tickets[17].id, type: "RELATED" },
      { sourceTicketId: tickets[4].id, targetTicketId: tickets[15].id, type: "RELATED" },
    ],
  });
  console.log("Created watchers and relations");

  console.log("\n=== Seed complete! ===");
  console.log("Users: 10 (1 admin, 2 managers, 4 agents, 3 customers)");
  console.log("Teams: 3 with 8 memberships");
  console.log("Tickets: 22 across all statuses and priorities");
  console.log("Comments: 14 | History: 8 | Tags: 8");
  console.log("Tasks: 18 with checklists and dependencies");
  console.log("Workflows: 3 templates, 2 active instances");
  console.log("KB: 4 categories, 10 articles");
  console.log("SLA: 3 policies, 2 breaches");
  console.log("Channels: 5 | Badges: 6 (12 awards)");
  console.log("Notifications: 11");
  console.log("\nAll passwords: password123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
