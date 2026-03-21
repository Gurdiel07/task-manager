import type { Job } from "bullmq";
import { db } from "@/lib/db";

export default async function notificationCleanupProcessor(_job: Job) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await db.notification.deleteMany({
    where: {
      isRead: true,
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  console.log(`Cleaned up ${result.count} old notifications`);
}
