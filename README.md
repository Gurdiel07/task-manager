# Task Manager

A full-stack customer support and task management platform built with Next.js 16. Runs entirely on Node.js — no external database or services required.

## Features

**Ticket Management**
- ✅ Full CRUD with priority levels (Critical, High, Medium, Low) and status workflow (Open → In Progress → Waiting → Resolved → Closed)
- ✅ Tags, watchers, ticket relations (duplicate, blocks, related, parent/child)
- ✅ Comment threads with internal notes, file attachments, and full change history
- ✅ Multi-channel intake: Email, Chat, Phone, WhatsApp, Social, Web, API
- ✅ Public portal for customers to submit and track tickets without an account

**Task Management**
- ✅ Tasks with checklists, time estimates, due dates, and assignees
- ✅ Task dependencies (DAG) and linking to tickets or workflow steps
- ✅ Table and list views with filtering and sorting

**Kanban Board**
- ✅ Drag-and-drop ticket board organized by status columns

**Workflow Engine**
- ✅ Visual workflow builder with a node-based canvas
- ✅ Step types: Manual, Automatic, Approval, Condition, Notification
- ✅ Active instance tracking with per-step status
- ✅ Snapshot and rollback support

**Knowledge Base**
- ✅ Hierarchical category tree, article editor, draft/published/archived states
- ✅ View counts, helpful ratings, and public read access
- ✅ Full-text search

**SLA Management**
- ✅ Configurable SLA policies with conditions (priority, category, team)
- ✅ Automated breach detection for first-response and resolution time
- ✅ Breach notifications via in-app alerts and email

**Analytics**
- ✅ Overview dashboard with key metrics and trend charts
- ✅ Ticket volume over time, status and priority distribution
- ✅ Team performance metrics and SLA compliance rates
- ✅ Agent leaderboard with resolved ticket counts

**Gamification**
- ✅ Badge system with configurable award criteria
- ✅ Per-user badge collection and leaderboard

**AI Features** *(requires API key)*
- ✅ Smart ticket prioritization, categorization, and routing suggestions
- ✅ Sentiment analysis and ticket clustering
- ✅ Natural-language automation rule builder (OpenAI or Anthropic)
- ✅ Inline AI panel on ticket detail view

**Real-Time**
- ✅ Socket.io powered live updates across ticket, task, and notification views
- ✅ In-app notification bell with unread count badge
- ✅ Live SLA breach alerts pushed to assignees

**Automation**
- ✅ Rule engine triggered on ticket create, update, and status change
- ✅ Actions: set priority/status, assign agent or team, add tag, send notification
- ✅ Execution history and audit log

**Administration**
- ✅ Team and member management with roles
- ✅ Channel configuration, AI provider settings
- ✅ Email delivery log and test sender
- ✅ Background job scheduler status

**UI**
- ✅ Dark/light mode with system preference detection
- ✅ Responsive layout with collapsible sidebar
- ✅ Command palette (⌘K) for quick navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| State | Zustand (client), TanStack Query v5 (server) |
| Database | SQLite via Prisma v7 + better-sqlite3 |
| Auth | NextAuth.js v5 (JWT sessions) |
| Real-time | Socket.io v4 |
| Charts | Recharts |
| AI | Vercel AI SDK (OpenAI + Anthropic) |
| Background Jobs | node-cron (in-process) |
| Email | Nodemailer (SMTP) |
| Forms | React Hook Form + Zod |
| Testing | Vitest, Testing Library, MSW |

---

## Requirements

- **Node.js 18+**

That's it. No database server, no Redis, no Docker required for local development.

---

## Quick Start

**macOS / Linux**
```bash
git clone <repository-url>
cd task-manager
./scripts/setup.sh
npm run dev
```

**Windows / cross-platform**
```bash
git clone <repository-url>
cd task-manager
node scripts/setup.mjs
npm run dev
```

The setup script will:
1. Install npm dependencies
2. Create `.env` with a randomly generated `NEXTAUTH_SECRET`
3. Run `prisma generate` and `prisma db push` to create the SQLite database
4. Optionally load demo data

Open [http://localhost:3000](http://localhost:3000).

**Demo credentials** (with seed data loaded):

| Role | Email | Password |
|---|---|---|
| Admin | admin@taskmanager.com | password123 |
| Manager | sarah@taskmanager.com | password123 |
| Agent | emily@taskmanager.com | password123 |
| Customer | anna@example.com | password123 |

---

## LAN Deployment

Deploy once on a company server so all employees can access it from their browsers — no installation needed on employee machines.

### Requirements

- One PC or server on the company network running Node.js 18+
- The machine must stay on while the app is in use

### Installation (IT person, one time)

1. Clone or copy the project to the server
2. Run the setup script — it will auto-detect the server's network IP and configure the app:

```bash
# macOS / Linux
./scripts/setup.sh

# Windows / cross-platform
node scripts/setup.mjs
```

3. Start the production server:

```bash
# Foreground (stop with Ctrl+C)
npm run start:lan

# Background (keeps running after terminal closes)
npm run start:bg
npm run stop          # to stop it later
```

The setup will display the URL, for example: `http://192.168.1.50:3000`

### For employees

Open a web browser and go to the URL provided by IT (e.g. `http://192.168.1.50:3000`). No installation or configuration needed.

### Auto-start on boot (optional)

**macOS** — create a LaunchAgent plist in `~/Library/LaunchAgents/`:
```xml
<key>ProgramArguments</key>
<array>
  <string>/bin/bash</string>
  <string>/path/to/task-manager/scripts/start-background.sh</string>
</array>
```

**Linux** — add a systemd service or use `@reboot` in crontab:
```bash
@reboot cd /path/to/task-manager && npm run start:bg
```

**Windows** — place a shortcut to `scripts/start.bat` in the Startup folder (`shell:startup`).

---

## Configuration

All configuration is done via `.env`. Copy `.env.example` to `.env` to get started (the setup script does this automatically).

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./data/taskmanager.db` | SQLite file path. Works out of the box. |
| `NEXTAUTH_URL` | `http://localhost:3000` | Public URL of the app. |
| `NEXTAUTH_SECRET` | *(generated)* | Secret for signing JWT sessions. Set to any long random string in production. |
| `OPENAI_API_KEY` | *(empty)* | Optional. Enables AI features using GPT models. |
| `ANTHROPIC_API_KEY` | *(empty)* | Optional. Enables AI features using Claude models. |
| `SMTP_HOST` | `localhost` | SMTP server hostname. Leave empty to disable email. |
| `SMTP_PORT` | `1025` | SMTP server port. |
| `SMTP_USER` | *(empty)* | SMTP username (if required). |
| `SMTP_PASS` | *(empty)* | SMTP password (if required). |
| `SMTP_FROM` | `Task Manager <noreply@...>` | Sender address for outgoing emails. |
| `SMTP_SECURE` | `false` | Set to `true` for TLS on port 465. |
| `SOCKET_PORT` | `3001` | Port for the Socket.io server. |
| `NEXT_PUBLIC_SOCKET_PORT` | `3001` | Client-side Socket.io port (must match above). |

For local email testing, [Mailpit](https://mailpit.axllent.org/) is a zero-config SMTP sink that captures outgoing emails.

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/       — Authenticated pages (tickets, tasks, workflows, etc.)
│   ├── api/               — REST API routes
│   ├── login/             — Authentication pages
│   └── portal/            — Public customer portal
├── components/
│   ├── ui/                — shadcn/ui primitives
│   ├── shared/            — Layout, navigation, notifications, data tables
│   ├── tickets/           — Ticket list, detail, kanban, comments, AI panel
│   ├── tasks/             — Task list, detail, forms
│   ├── workflows/         — Workflow builder canvas, step editor, instance panel
│   └── admin/             — Queue dashboard, email dashboard
├── hooks/                 — TanStack Query hooks for each data domain
├── lib/
│   ├── db/                — Prisma client (SQLite, WAL mode)
│   ├── auth/              — NextAuth configuration (edge + Node.js)
│   ├── email/             — Transport, templates, delivery log
│   ├── jobs/              — node-cron scheduler, SLA check, cleanup jobs, automation engine
│   ├── realtime/          — Socket.io server initialization and room management
│   ├── ai/                — Vercel AI SDK integration, prediction log
│   ├── validators/        — Zod schemas for all API inputs
│   └── analytics-api.ts   — Analytics aggregation queries
├── generated/
│   └── prisma/            — Prisma generated client (gitignored, built locally)
└── types/                 — Shared TypeScript types (ApiResponse, etc.)
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run setup` | Interactive setup wizard (install deps, create DB, optional seed) |
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server (foreground) |
| `npm run start:lan` | Build then start production server |
| `npm run start:bg` | Build and run in background (LAN deployment) |
| `npm run stop` | Stop background server |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ui` | Open Vitest UI |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type check without emitting |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma db seed` | (Re-)load demo data |
| `make reset` | Drop and recreate the database with fresh seed data |

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access. User management, system settings, AI provider configuration, all analytics. |
| **Manager** | Team management, all tickets and tasks, analytics dashboard, SLA configuration. |
| **Agent** | Create and manage tickets and tasks, comment (including internal notes), knowledge base authoring. |
| **Customer** | Submit tickets via the portal or dashboard, view own tickets, read published knowledge base articles. |

---

## License

Private
