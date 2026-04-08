import * as cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import { checkSlaBreaches } from "./sla-check";
import { cleanupNotifications } from "./notification-cleanup";
import { cleanupOrphanedFiles } from "./file-cleanup";

const scheduledTasks: ScheduledTask[] = [];

export function startScheduler(): void {
  // SLA breach check — every 5 minutes
  scheduledTasks.push(
    cron.schedule("*/5 * * * *", async () => {
      try {
        await checkSlaBreaches();
      } catch (e) {
        console.error("[Scheduler] SLA check failed:", e);
      }
    })
  );

  // Notification cleanup — every day at 3 AM
  scheduledTasks.push(
    cron.schedule("0 3 * * *", async () => {
      try {
        await cleanupNotifications();
      } catch (e) {
        console.error("[Scheduler] Notification cleanup failed:", e);
      }
    })
  );

  // File cleanup — every day at 4 AM
  scheduledTasks.push(
    cron.schedule("0 4 * * *", async () => {
      try {
        await cleanupOrphanedFiles();
      } catch (e) {
        console.error("[Scheduler] File cleanup failed:", e);
      }
    })
  );

  console.log("[Scheduler] 3 recurring jobs scheduled (SLA check, notification cleanup, file cleanup)");
}

export function stopScheduler(): void {
  scheduledTasks.forEach((t) => t.stop());
  scheduledTasks.length = 0;
  console.log("[Scheduler] All jobs stopped");
}
