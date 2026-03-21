import type { Job } from "bullmq";
import { db } from "@/lib/db";
import { emitToUser } from "@/lib/realtime/socket-server";
import { queueEmail } from "@/lib/email/send";

export default async function slaCheckProcessor(_job: Job) {
  const openTickets = await db.ticket.findMany({
    where: {
      status: { notIn: ["RESOLVED", "CLOSED"] },
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      priority: true,
      category: true,
      teamId: true,
      assignedToId: true,
      createdAt: true,
      firstResponseAt: true,
      resolvedAt: true,
      slaBreaches: {
        select: { policyId: true, type: true },
      },
      assignedTo: {
        select: { email: true, name: true },
      },
    },
  });

  const policies = await db.sLAPolicy.findMany({
    where: { isActive: true },
  });

  let breachCount = 0;

  for (const ticket of openTickets) {
    const elapsedMin = (Date.now() - ticket.createdAt.getTime()) / 60_000;
    const existingBreachKeys = new Set(
      ticket.slaBreaches.map((b) => `${b.policyId}:${b.type}`)
    );

    for (const policy of policies) {
      const conditions = policy.conditions as Record<string, unknown>;

      if (conditions.priority && conditions.priority !== ticket.priority) continue;
      if (conditions.category && conditions.category !== ticket.category) continue;
      if (conditions.teamId && conditions.teamId !== ticket.teamId) continue;

      const newBreaches: Array<{ type: "FIRST_RESPONSE" | "RESOLUTION" }> = [];

      if (
        !ticket.firstResponseAt &&
        elapsedMin > policy.responseTimeMin &&
        !existingBreachKeys.has(`${policy.id}:FIRST_RESPONSE`)
      ) {
        newBreaches.push({ type: "FIRST_RESPONSE" });
      }

      if (
        !ticket.resolvedAt &&
        elapsedMin > policy.resolutionMin &&
        !existingBreachKeys.has(`${policy.id}:RESOLUTION`)
      ) {
        newBreaches.push({ type: "RESOLUTION" });
      }

      for (const breach of newBreaches) {
        await db.sLABreach.create({
          data: {
            ticketId: ticket.id,
            policyId: policy.id,
            type: breach.type,
            notifiedAt: new Date(),
          },
        });
        breachCount++;

        const notificationTitle =
          breach.type === "FIRST_RESPONSE"
            ? "SLA First Response Breach"
            : "SLA Resolution Breach";
        const notificationMessage =
          breach.type === "FIRST_RESPONSE"
            ? `Ticket has not received a first response within the required time`
            : `Ticket has not been resolved within the required time`;

        const usersToNotify: string[] = [];
        if (ticket.assignedToId) usersToNotify.push(ticket.assignedToId);

        if (ticket.teamId) {
          const managers = await db.teamMember.findMany({
            where: { teamId: ticket.teamId, role: "MANAGER" },
            select: { userId: true },
          });
          for (const m of managers) {
            if (!usersToNotify.includes(m.userId)) {
              usersToNotify.push(m.userId);
            }
          }
        }

        for (const userId of usersToNotify) {
          await db.notification.create({
            data: {
              userId,
              type: "SLA_BREACH",
              title: notificationTitle,
              message: notificationMessage,
              link: `/tickets/${ticket.id}`,
            },
          });

          try {
            emitToUser(userId, "sla:breach", {
              ticketId: ticket.id,
              type: breach.type,
              policyId: policy.id,
            });
          } catch {
            // Real-time emit failures must not break the worker
          }

          // Queue email for the assigned user (who has a known email)
          if (userId === ticket.assignedToId && ticket.assignedTo?.email) {
            await queueEmail({
              type: "sla_breach",
              to: ticket.assignedTo.email,
              data: {
                ticketNumber: ticket.id,
                ticketTitle: ticket.title,
                ticketUrl: `${process.env.NEXTAUTH_URL ?? ""}/tickets/${ticket.id}`,
                breachType: breach.type,
                policyName: policy.name,
              },
            });
          }
        }
      }
    }
  }

  console.log(
    `SLA check complete: ${openTickets.length} tickets checked, ${breachCount} breaches found`
  );
}
