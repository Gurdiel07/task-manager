import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createSnapshotSchema } from "@/lib/validators/workflow";
import { createSnapshot } from "@/lib/workflow-engine";

type RouteContext = { params: Promise<{ instanceId: string }> };

const userSelect = { id: true, name: true, email: true, image: true };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { instanceId } = await context.params;

    const snapshots = await db.workflowSnapshot.findMany({
      where: { instanceId },
      include: { createdBy: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(snapshots);
  } catch (error) {
    console.error("Failed to fetch snapshots:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch snapshots",
    });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }

  try {
    const { instanceId } = await context.params;
    const body = await request.json();
    const validated = createSnapshotSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const instance = await db.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      return apiError("Not found", {
        status: 404,
        message: "Workflow instance not found",
      });
    }

    const snapshot = await createSnapshot(
      instanceId,
      session.user.id,
      validated.data.note
    );

    return apiSuccess(snapshot, {
      status: 201,
      message: "Snapshot created",
    });
  } catch (error) {
    console.error("Failed to create snapshot:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to create snapshot",
    });
  }
}
