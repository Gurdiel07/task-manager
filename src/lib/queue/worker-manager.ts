import { Worker } from "bullmq";
import type { Processor } from "bullmq";
import { createRedisConnection } from "./redis";
import slaCheckProcessor from "./workers/sla-check.worker";
import notificationCleanupProcessor from "./workers/notification-cleanup.worker";
import fileCleanupProcessor from "./workers/file-cleanup.worker";
import automationProcessor from "./workers/automation.worker";
import emailProcessor from "./workers/email.worker";

export function startWorkers(): Worker[] {
  const workers: Worker[] = [];

  const workerConfigs: Array<{ name: string; processor: Processor }> = [
    { name: "sla-check", processor: slaCheckProcessor as Processor },
    { name: "notification-cleanup", processor: notificationCleanupProcessor as Processor },
    { name: "file-cleanup", processor: fileCleanupProcessor as Processor },
    { name: "automation", processor: automationProcessor as Processor },
    { name: "email", processor: emailProcessor as Processor },
  ];

  for (const config of workerConfigs) {
    const worker = new Worker(config.name, config.processor, {
      connection: createRedisConnection(),
    });

    worker.on("failed", (job, err) => {
      console.error(`[Worker:${config.name}] Job ${job?.id} failed:`, err.message);
    });

    worker.on("completed", (job) => {
      console.debug(`[Worker:${config.name}] Job ${job.id} completed`);
    });

    workers.push(worker);
  }

  console.log(`[Workers] Started ${workers.length} workers`);
  return workers;
}

export async function stopWorkers(workers: Worker[]): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  console.log("[Workers] All workers stopped");
}
