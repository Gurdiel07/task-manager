import { emailQueue } from "@/lib/queue/queues";
import type { EmailJobData } from "@/lib/queue/workers/email.worker";

export async function queueEmail(params: EmailJobData): Promise<void> {
  try {
    await emailQueue.add("email", params);
  } catch (err) {
    console.error("[email] Failed to queue email:", err);
  }
}

export async function queueBulkEmail(
  recipients: string[],
  type: EmailJobData["type"],
  data: Record<string, unknown>
): Promise<void> {
  for (const to of recipients) {
    await queueEmail({ type, to, data });
  }
}
