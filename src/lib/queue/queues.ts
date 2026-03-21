import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

const connection = getRedisConnection();

export const slaCheckQueue = new Queue("sla-check", {
  connection,
  defaultJobOptions,
});

export const notificationCleanupQueue = new Queue("notification-cleanup", {
  connection,
  defaultJobOptions,
});

export const fileCleanupQueue = new Queue("file-cleanup", {
  connection,
  defaultJobOptions,
});

export const automationQueue = new Queue("automation", {
  connection,
  defaultJobOptions,
});

export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions,
});
