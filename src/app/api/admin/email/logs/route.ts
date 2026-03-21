import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getRecentEmailLogs } from "@/lib/email/tracker";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return apiError("Forbidden", { status: 403, message: "Admin access required" });
  }

  try {
    const logs = getRecentEmailLogs();
    return apiSuccess(logs);
  } catch (error) {
    console.error("Failed to fetch email logs:", error);
    return apiError("Internal server error", { status: 500, message: "Unable to fetch email logs" });
  }
}
