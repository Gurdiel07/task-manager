import {
  slaCheckQueue,
  notificationCleanupQueue,
  fileCleanupQueue,
} from "./queues";

export async function scheduleRecurringJobs(): Promise<void> {
  await slaCheckQueue.upsertJobScheduler(
    "sla-check-scheduler",
    { pattern: "*/5 * * * *" },
    { name: "sla-check" }
  );

  await notificationCleanupQueue.upsertJobScheduler(
    "notification-cleanup-scheduler",
    { pattern: "0 3 * * *" },
    { name: "notification-cleanup" }
  );

  await fileCleanupQueue.upsertJobScheduler(
    "file-cleanup-scheduler",
    { pattern: "0 4 * * *" },
    { name: "file-cleanup" }
  );

  console.log("[Scheduler] Recurring jobs scheduled");
}
