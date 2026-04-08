import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { AutomationTrigger, Priority, TicketStatus } from "@/generated/prisma/client";

export type AutomationTriggerInput = "TICKET_CREATED" | "TICKET_UPDATED" | "STATUS_CHANGED";

interface CompiledRuleCondition {
  field: string;
  operator: string;
  value: unknown;
}

interface CompiledRuleAction {
  type:
    | "SET_PRIORITY"
    | "SET_STATUS"
    | "ASSIGN_TO"
    | "ASSIGN_TEAM"
    | "ADD_TAG"
    | "SEND_NOTIFICATION";
  value?: string;
  message?: string;
  title?: string;
  userId?: string;
}

interface CompiledRule {
  conditions?: CompiledRuleCondition[];
  actions?: CompiledRuleAction[];
}

type TicketRecord = Record<string, unknown>;

function evaluateCondition(
  ticket: TicketRecord,
  condition: CompiledRuleCondition
): boolean {
  const fieldValue = ticket[condition.field];

  switch (condition.operator) {
    case "eq":
    case "equals":
      return fieldValue === condition.value;
    case "neq":
    case "not_equals":
      return fieldValue !== condition.value;
    case "contains":
      return (
        typeof fieldValue === "string" &&
        typeof condition.value === "string" &&
        fieldValue.toLowerCase().includes(condition.value.toLowerCase())
      );
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    default:
      return true;
  }
}

function evaluateConditions(
  ticket: TicketRecord,
  conditions: CompiledRuleCondition[]
): boolean {
  return conditions.every((c) => evaluateCondition(ticket, c));
}

export async function runAutomation(
  ticketId: string,
  trigger: AutomationTriggerInput
): Promise<void> {
  const ticket = await db.ticket.findFirst({
    where: { id: ticketId, deletedAt: null },
    include: {
      tags: { include: { tag: true } },
      assignedTo: true,
      team: true,
    },
  });

  if (!ticket) {
    console.warn(`[Automation] Ticket ${ticketId} not found, skipping`);
    return;
  }

  const triggerMap: Record<string, AutomationTrigger> = {
    TICKET_CREATED: "TICKET_CREATED",
    TICKET_UPDATED: "TICKET_UPDATED",
    STATUS_CHANGED: "TICKET_STATUS_CHANGED",
  };

  const mappedTrigger = triggerMap[trigger];
  if (!mappedTrigger) return;

  const rules = await db.automationRule.findMany({
    where: { isActive: true, triggerType: mappedTrigger },
  });

  const ticketRecord = ticket as unknown as TicketRecord;

  for (const rule of rules) {
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let result: Record<string, unknown> = {};

    try {
      const compiled = rule.compiledRule as CompiledRule;
      const conditions = compiled.conditions ?? [];
      const actions = compiled.actions ?? [];

      if (!evaluateConditions(ticketRecord, conditions)) {
        continue;
      }

      for (const action of actions) {
        switch (action.type) {
          case "SET_PRIORITY":
            await db.ticket.update({
              where: { id: ticketId },
              data: { priority: action.value as Priority },
            });
            result.setPriority = action.value;
            break;

          case "SET_STATUS":
            await db.ticket.update({
              where: { id: ticketId },
              data: { status: action.value as TicketStatus },
            });
            result.setStatus = action.value;
            break;

          case "ASSIGN_TO":
            await db.ticket.update({
              where: { id: ticketId },
              data: { assignedToId: action.value },
            });
            result.assignTo = action.value;
            break;

          case "ASSIGN_TEAM":
            await db.ticket.update({
              where: { id: ticketId },
              data: { teamId: action.value },
            });
            result.assignTeam = action.value;
            break;

          case "ADD_TAG": {
            if (!action.value) break;
            let tag = await db.ticketTag.findUnique({
              where: { name: action.value },
            });
            if (!tag) {
              tag = await db.ticketTag.create({
                data: { name: action.value },
              });
            }
            await db.ticketTagRelation.upsert({
              where: { ticketId_tagId: { ticketId, tagId: tag.id } },
              create: { ticketId, tagId: tag.id },
              update: {},
            });
            result.addTag = action.value;
            break;
          }

          case "SEND_NOTIFICATION": {
            const targetUserId = action.userId ?? ticket.assignedToId;
            if (targetUserId) {
              await db.notification.create({
                data: {
                  userId: targetUserId,
                  type: "SYSTEM",
                  title: action.title ?? "Automation Notification",
                  message:
                    action.message ?? `Automation rule "${rule.name}" triggered`,
                  link: `/tickets/${ticketId}`,
                },
              });
              result.notifiedUser = targetUserId;
            }
            break;
          }
        }
      }
    } catch (err) {
      status = "FAILED";
      result.error = err instanceof Error ? err.message : String(err);
      console.error(
        `[Automation] Rule ${rule.id} failed for ticket ${ticketId}:`,
        err
      );
    }

    await db.automationExecution.create({
      data: {
        ruleId: rule.id,
        ticketId,
        status,
        result: result as Prisma.InputJsonValue,
      },
    });

    console.log(
      `[Automation] Rule "${rule.name}" executed on ticket ${ticketId}: ${status}`
    );
  }
}
