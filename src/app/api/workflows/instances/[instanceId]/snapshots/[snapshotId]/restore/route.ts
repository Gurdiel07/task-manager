import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { restoreSnapshot } from "@/lib/workflow-engine";

type RouteContext = {
  params: Promise<{ instanceId: string; snapshotId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { instanceId, snapshotId } = await context.params;

    const snapshot = await db.workflowSnapshot.findFirst({
      where: { id: snapshotId, instanceId },
    });

    if (!snapshot) {
      return apiError("Not found", {
        status: 404,
        message: "Snapshot not found for this instance",
      });
    }

    const instance = await restoreSnapshot(snapshotId, session.user.id);

    return apiSuccess(instance, { message: "Snapshot restored successfully" });
  } catch (error) {
    console.error("Failed to restore snapshot:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to restore snapshot",
    });
  }
}
