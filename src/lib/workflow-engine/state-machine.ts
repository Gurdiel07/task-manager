import { db } from "@/lib/db";

export async function getAvailableTransitions(
  templateId: string,
  currentStepId: string
) {
  return db.workflowTransition.findMany({
    where: {
      templateId,
      fromStepId: currentStepId,
    },
    include: {
      toStep: true,
    },
  });
}

export async function validateTransition(
  templateId: string,
  fromStepId: string,
  toStepId: string
) {
  const transition = await db.workflowTransition.findFirst({
    where: {
      templateId,
      fromStepId,
      toStepId,
    },
  });
  return transition !== null;
}

export function evaluateCondition(
  condition: Record<string, unknown>,
  context: Record<string, unknown>
): boolean {
  const field = condition.field as string | undefined;
  const operator = condition.operator as string | undefined;
  const value = condition.value;

  if (!field || !operator) return true;

  const contextValue = context[field];

  switch (operator) {
    case "eq":
      return contextValue === value;
    case "neq":
      return contextValue !== value;
    case "gt":
      return (
        typeof contextValue === "number" &&
        typeof value === "number" &&
        contextValue > value
      );
    case "lt":
      return (
        typeof contextValue === "number" &&
        typeof value === "number" &&
        contextValue < value
      );
    case "contains":
      return (
        typeof contextValue === "string" &&
        typeof value === "string" &&
        contextValue.includes(value)
      );
    case "in":
      return Array.isArray(value) && value.includes(contextValue);
    default:
      return false;
  }
}

export async function getFirstStep(templateId: string) {
  return db.workflowStep.findFirst({
    where: { templateId },
    orderBy: { order: "asc" },
  });
}
