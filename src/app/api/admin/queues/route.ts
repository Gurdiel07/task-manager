import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  slaCheckQueue,
  notificationCleanupQueue,
  fileCleanupQueue,
  automationQueue,
  emailQueue,
} from "@/lib/queue/queues";
import type { Queue } from "bullmq";

const allQueues: { name: string; queue: Queue }[] = [
  { name: "sla-check", queue: slaCheckQueue },
  { name: "notification-cleanup", queue: notificationCleanupQueue },
  { name: "file-cleanup", queue: fileCleanupQueue },
  { name: "automation", queue: automationQueue },
  { name: "email", queue: emailQueue },
];

async function requireAdmin(request: NextRequest) {
  void request;
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { id: string; role: string };
  if (user.role !== "ADMIN") return null;
  return user;
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "Admin access required" });
  }

  try {
    const stats = await Promise.all(
      allQueues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ]);
        return { name, waiting, active, completed, failed, delayed };
      })
    );

    return apiSuccess(stats);
  } catch (error) {
    console.error("Failed to fetch queue stats:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch queue stats",
    });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) {
    return apiError("Unauthorized", { status: 401, message: "Admin access required" });
  }

  try {
    const body = await request.json();
    const queueName = typeof body?.queue === "string" ? body.queue : "";
    const action = typeof body?.action === "string" ? body.action : "";

    if (!queueName || !action) {
      return apiError("Bad request", {
        status: 400,
        message: "Both 'queue' and 'action' are required strings",
      });
    }

    const found = allQueues.find((q) => q.name === queueName);
    if (!found) {
      return apiError("Not found", {
        status: 404,
        message: `Queue "${queueName}" not found`,
      });
    }

    const { queue } = found;

    switch (action) {
      case "clean":
        await queue.clean(0, 1000, "completed");
        await queue.clean(0, 1000, "failed");
        break;
      case "retry-failed": {
        const failedJobs = await queue.getFailed();
        await Promise.all(failedJobs.map((job) => job.retry()));
        break;
      }
      case "pause":
        await queue.pause();
        break;
      case "resume":
        await queue.resume();
        break;
      default:
        return apiError("Bad request", {
          status: 400,
          message: `Unknown action "${action}"`,
        });
    }

    return apiSuccess({ queue: queueName, action }, { message: "Action executed" });
  } catch (error) {
    console.error("Failed to execute queue action:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to execute queue action",
    });
  }
}
