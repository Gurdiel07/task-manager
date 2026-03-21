import type { Job } from "bullmq";
import { sendEmail } from "@/lib/email/transport";
import {
  ticketCreated,
  ticketAssigned,
  ticketStatusChanged,
  ticketCommented,
  slaBreach,
  passwordReset,
} from "@/lib/email/templates";
import { addEmailLog } from "@/lib/email/tracker";
import { randomUUID } from "crypto";

export interface EmailJobData {
  type:
    | "ticket_created"
    | "ticket_assigned"
    | "ticket_status_changed"
    | "ticket_commented"
    | "sla_breach"
    | "password_reset"
    | "custom";
  to: string | string[];
  data: Record<string, unknown>;
  subject?: string;
  html?: string;
}

export default async function emailProcessor(job: Job<EmailJobData>) {
  const { type, to, data, subject: customSubject, html: customHtml } = job.data;

  let subject: string;
  let html: string;

  switch (type) {
    case "ticket_created": {
      const tpl = ticketCreated({
        ticketNumber: String(data.ticketNumber ?? ""),
        ticketTitle: String(data.ticketTitle ?? ""),
        ticketUrl: String(data.ticketUrl ?? ""),
      });
      subject = tpl.subject;
      html = tpl.html;
      break;
    }
    case "ticket_assigned": {
      const tpl = ticketAssigned({
        ticketNumber: String(data.ticketNumber ?? ""),
        ticketTitle: String(data.ticketTitle ?? ""),
        ticketUrl: String(data.ticketUrl ?? ""),
        assigneeName: String(data.assigneeName ?? ""),
      });
      subject = tpl.subject;
      html = tpl.html;
      break;
    }
    case "ticket_status_changed": {
      const tpl = ticketStatusChanged({
        ticketNumber: String(data.ticketNumber ?? ""),
        ticketTitle: String(data.ticketTitle ?? ""),
        ticketUrl: String(data.ticketUrl ?? ""),
        oldStatus: String(data.oldStatus ?? ""),
        newStatus: String(data.newStatus ?? ""),
      });
      subject = tpl.subject;
      html = tpl.html;
      break;
    }
    case "ticket_commented": {
      const tpl = ticketCommented({
        ticketNumber: String(data.ticketNumber ?? ""),
        ticketTitle: String(data.ticketTitle ?? ""),
        ticketUrl: String(data.ticketUrl ?? ""),
        commenterName: String(data.commenterName ?? ""),
        commentPreview: String(data.commentPreview ?? ""),
      });
      subject = tpl.subject;
      html = tpl.html;
      break;
    }
    case "sla_breach": {
      const tpl = slaBreach({
        ticketNumber: String(data.ticketNumber ?? ""),
        ticketTitle: String(data.ticketTitle ?? ""),
        ticketUrl: String(data.ticketUrl ?? ""),
        breachType: String(data.breachType ?? ""),
        policyName: String(data.policyName ?? ""),
      });
      subject = tpl.subject;
      html = tpl.html;
      break;
    }
    case "password_reset": {
      const tpl = passwordReset({
        resetUrl: String(data.resetUrl ?? ""),
        userName: String(data.userName ?? ""),
      });
      subject = tpl.subject;
      html = tpl.html;
      break;
    }
    case "custom": {
      subject = customSubject ?? "Notification from Task Manager";
      html = customHtml ?? String(data.message ?? "");
      break;
    }
    default:
      throw new Error(`Unknown email job type: ${type}`);
  }

  try {
    await sendEmail({ to, subject, html });
    addEmailLog({
      id: randomUUID(),
      to,
      subject,
      status: "sent",
      sentAt: new Date(),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    addEmailLog({
      id: randomUUID(),
      to,
      subject,
      status: "failed",
      sentAt: new Date(),
      error: errorMessage,
    });
    throw err;
  }
}
