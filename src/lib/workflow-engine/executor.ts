import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  getAvailableTransitions,
  evaluateCondition,
  validateTransition,
} from "./state-machine";

const userSelect = { id: true, name: true, email: true, image: true } as const;

const instanceDetailInclude = {
  steps: {
    include: {
      step: true,
      assignedTo: { select: userSelect },
    },
    orderBy: { step: { order: "asc" as const } },
  },
  template: {
    select: { id: true, name: true, description: true, category: true },
  },
  ticket: { select: { id: true, number: true, title: true } },
  snapshots: {
    include: { createdBy: { select: userSelect } },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

export async function startWorkflow(
  templateId: string,
  ticketId: string,
  _userId: string
) {
  const steps = await db.workflowStep.findMany({
    where: { templateId },
    orderBy: { order: "asc" },
  });

  if (steps.length === 0) {
    throw new Error("Template has no steps");
  }

  const firstStep = steps[0];

  return db.$transaction(async (tx) => {
    const instance = await tx.workflowInstance.create({
      data: {
        templateId,
        ticketId,
        currentStepId: firstStep.id,
        status: "ACTIVE",
      },
    });

    await tx.workflowInstanceStep.createMany({
      data: steps.map((step) => ({
        instanceId: instance.id,
        stepId: step.id,
        status:
          step.id === firstStep.id
            ? ("IN_PROGRESS" as const)
            : ("PENDING" as const),
        startedAt: step.id === firstStep.id ? new Date() : undefined,
      })),
    });

    return tx.workflowInstance.findUniqueOrThrow({
      where: { id: instance.id },
      include: instanceDetailInclude,
    });
  });
}

export async function completeStep(
  instanceId: string,
  stepId: string,
  _userId: string,
  data?: Record<string, unknown>
) {
  const instanceStep = await db.workflowInstanceStep.findFirst({
    where: { instanceId, stepId },
    include: { instance: true },
  });

  if (!instanceStep) throw new Error("Instance step not found");
  if (instanceStep.status !== "IN_PROGRESS")
    throw new Error("Step is not in progress");

  const transitions = await getAvailableTransitions(
    instanceStep.instance.templateId,
    stepId
  );

  const context = {
    ...((instanceStep.instance.data as Record<string, unknown>) ?? {}),
    ...(data ?? {}),
  };

  const validTransitions = transitions.filter((t) => {
    if (!t.condition || Object.keys(t.condition as object).length === 0)
      return true;
    return evaluateCondition(
      t.condition as Record<string, unknown>,
      context
    );
  });

  return db.$transaction(async (tx) => {
    await tx.workflowInstanceStep.update({
      where: { id: instanceStep.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    if (validTransitions.length >= 1) {
      const nextStepId = validTransitions[0].toStepId;
      await tx.workflowInstanceStep.updateMany({
        where: { instanceId, stepId: nextStepId },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: { currentStepId: nextStepId },
      });
    } else {
      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          currentStepId: null,
        },
      });
    }

    return tx.workflowInstance.findUniqueOrThrow({
      where: { id: instanceId },
      include: instanceDetailInclude,
    });
  });
}

export async function skipStep(
  instanceId: string,
  stepId: string,
  _userId: string
) {
  const instanceStep = await db.workflowInstanceStep.findFirst({
    where: { instanceId, stepId },
    include: { instance: true },
  });

  if (!instanceStep) throw new Error("Instance step not found");
  if (instanceStep.status !== "IN_PROGRESS" && instanceStep.status !== "PENDING")
    throw new Error("Step cannot be skipped");

  const transitions = await getAvailableTransitions(
    instanceStep.instance.templateId,
    stepId
  );

  const validTransitions = transitions.filter((t) => {
    if (!t.condition || Object.keys(t.condition as object).length === 0)
      return true;
    const context =
      (instanceStep.instance.data as Record<string, unknown>) ?? {};
    return evaluateCondition(
      t.condition as Record<string, unknown>,
      context
    );
  });

  return db.$transaction(async (tx) => {
    await tx.workflowInstanceStep.update({
      where: { id: instanceStep.id },
      data: {
        status: "SKIPPED",
        completedAt: new Date(),
      },
    });

    if (validTransitions.length >= 1) {
      const nextStepId = validTransitions[0].toStepId;
      await tx.workflowInstanceStep.updateMany({
        where: { instanceId, stepId: nextStepId },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: { currentStepId: nextStepId },
      });
    } else {
      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          currentStepId: null,
        },
      });
    }

    return tx.workflowInstance.findUniqueOrThrow({
      where: { id: instanceId },
      include: instanceDetailInclude,
    });
  });
}

export async function failStep(
  instanceId: string,
  stepId: string,
  _userId: string,
  reason?: string
) {
  const instanceStep = await db.workflowInstanceStep.findFirst({
    where: { instanceId, stepId },
  });

  if (!instanceStep) throw new Error("Instance step not found");

  return db.$transaction(async (tx) => {
    await tx.workflowInstanceStep.update({
      where: { id: instanceStep.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        data: reason ? ({ reason } as Prisma.InputJsonValue) : undefined,
      },
    });

    await tx.workflowInstance.update({
      where: { id: instanceId },
      data: { status: "FAILED" },
    });

    return tx.workflowInstance.findUniqueOrThrow({
      where: { id: instanceId },
      include: instanceDetailInclude,
    });
  });
}

export async function pauseWorkflow(instanceId: string, _userId: string) {
  return db.workflowInstance.update({
    where: { id: instanceId },
    data: { status: "PAUSED" },
    include: instanceDetailInclude,
  });
}

export async function resumeWorkflow(instanceId: string, _userId: string) {
  return db.workflowInstance.update({
    where: { id: instanceId },
    data: { status: "ACTIVE" },
    include: instanceDetailInclude,
  });
}

export async function cancelWorkflow(instanceId: string, _userId: string) {
  return db.workflowInstance.update({
    where: { id: instanceId },
    data: { status: "CANCELLED", completedAt: new Date() },
    include: instanceDetailInclude,
  });
}

export async function advanceToStep(
  instanceId: string,
  targetStepId: string,
  _userId: string
) {
  const instance = await db.workflowInstance.findUniqueOrThrow({
    where: { id: instanceId },
  });

  if (!instance.currentStepId) {
    throw new Error("Workflow has no current step");
  }

  if (instance.status !== "ACTIVE") {
    throw new Error("Workflow is not active");
  }

  const isValid = await validateTransition(
    instance.templateId,
    instance.currentStepId,
    targetStepId
  );

  if (!isValid) {
    throw new Error("Invalid transition");
  }

  const currentStepId = instance.currentStepId!;

  return db.$transaction(async (tx) => {
    await tx.workflowInstanceStep.updateMany({
      where: { instanceId, stepId: currentStepId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await tx.workflowInstanceStep.updateMany({
      where: { instanceId, stepId: targetStepId },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });

    await tx.workflowInstance.update({
      where: { id: instanceId },
      data: { currentStepId: targetStepId },
    });

    return tx.workflowInstance.findUniqueOrThrow({
      where: { id: instanceId },
      include: instanceDetailInclude,
    });
  });
}
