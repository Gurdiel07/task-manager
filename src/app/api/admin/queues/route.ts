import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401, message: "Admin access required" });
  }
  const user = session.user as { id: string; role: string };
  if (user.role !== "ADMIN") {
    return apiError("Unauthorized", { status: 401, message: "Admin access required" });
  }

  return apiSuccess({
    scheduler: "running",
    jobs: [
      { name: "sla-breach-check", schedule: "*/5 * * * *", description: "Check for SLA breaches every 5 minutes" },
      { name: "notification-cleanup", schedule: "0 3 * * *", description: "Delete read notifications older than 30 days, daily at 3 AM" },
      { name: "file-cleanup", schedule: "0 4 * * *", description: "Remove orphaned upload files, daily at 4 AM" },
    ],
  });
}
