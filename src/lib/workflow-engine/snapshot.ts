import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const userSelect = { id: true, name: true, email: true, image: true } as const;

export async function createSnapshot(
  instanceId: string,
  userId: string,
  note?: string
) {
  const instance = await db.workflowInstance.findUniqueOrThrow({
    where: { id: instanceId },
    include: {
      steps: true,
    },
  });

  const snapshotData = {
    instanceId: instance.id,
    status: instance.status,
    currentStepId: instance.currentStepId,
    data: instance.data,
    steps: instance.steps.map((s) => ({
      id: s.id,
      stepId: s.stepId,
      status: s.status,
      assignedToId: s.assignedToId,
      data: s.data,
      startedAt: s.startedAt?.toISOString() ?? null,
      completedAt: s.completedAt?.toISOString() ?? null,
    })),
  };

  return db.workflowSnapshot.create({
    data: {
      instanceId,
      snapshotData,
      note,
      createdById: userId,
    },
    include: {
      createdBy: { select: userSelect },
    },
  });
}

export async function restoreSnapshot(snapshotId: string, _userId: string) {
  const snapshot = await db.workflowSnapshot.findUniqueOrThrow({
    where: { id: snapshotId },
  });

  const data = snapshot.snapshotData as {
    status: string;
    currentStepId: string | null;
    data: unknown;
    steps: Array<{
      id: string;
      stepId: string;
      status: string;
      assignedToId: string | null;
      data: unknown;
      startedAt: string | null;
      completedAt: string | null;
    }>;
  };

  return db.$transaction(async (tx) => {
    await tx.workflowInstance.update({
      where: { id: snapshot.instanceId },
      data: {
        status: data.status as "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | "FAILED",
        currentStepId: data.currentStepId,
        data: (data.data ?? undefined) as Prisma.InputJsonValue | undefined,
        completedAt: data.status === "COMPLETED" ? new Date() : null,
      },
    });

    for (const step of data.steps) {
      await tx.workflowInstanceStep.update({
        where: { id: step.id },
        data: {
          status: step.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "FAILED",
          assignedToId: step.assignedToId,
          data: (step.data ?? undefined) as Prisma.InputJsonValue | undefined,
          startedAt: step.startedAt ? new Date(step.startedAt) : null,
          completedAt: step.completedAt ? new Date(step.completedAt) : null,
        },
      });
    }

    return tx.workflowInstance.findUniqueOrThrow({
      where: { id: snapshot.instanceId },
      include: {
        steps: {
          include: {
            step: true,
            assignedTo: { select: userSelect },
          },
          orderBy: { step: { order: "asc" } },
        },
        template: {
          select: { id: true, name: true, description: true, category: true },
        },
        ticket: { select: { id: true, number: true, title: true } },
        snapshots: {
          include: { createdBy: { select: userSelect } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  });
}
