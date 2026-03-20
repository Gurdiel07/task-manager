import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { parseAutomationRule } from "@/lib/ai/services";
import { serializeAutomationRuleDetail } from "@/lib/ai/serializers";
import { automationRuleUpdateSchema } from "@/lib/validators/ai";

type AutomationRuleRouteContext = {
  params: Promise<{ id: string }>;
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

const automationRuleDetailInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  _count: {
    select: {
      executions: true,
    },
  },
  executions: {
    take: 20,
    orderBy: {
      executedAt: "desc" as const,
    },
  },
};

export async function GET(_request: Request, context: AutomationRuleRouteContext) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view automation rules",
    });
  }

  try {
    const { id } = await context.params;
    const rule = await db.automationRule.findUnique({
      where: { id },
      include: automationRuleDetailInclude,
    });

    if (!rule) {
      return apiError("Not found", {
        status: 404,
        message: "Automation rule not found",
      });
    }

    return apiSuccess(serializeAutomationRuleDetail(rule));
  } catch (error) {
    console.error("Failed to fetch automation rule:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch automation rule",
    });
  }
}

export async function PUT(request: Request, context: AutomationRuleRouteContext) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to update automation rules",
    });
  }

  try {
    const { id } = await context.params;
    const existingRule = await db.automationRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return apiError("Not found", {
        status: 404,
        message: "Automation rule not found",
      });
    }

    const body = await request.json();
    const validated = automationRuleUpdateSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const data: Prisma.AutomationRuleUncheckedUpdateInput = {};

    if (validated.data.name !== undefined) {
      data.name = validated.data.name;
    }

    if (Object.prototype.hasOwnProperty.call(body, "description")) {
      data.description = validated.data.description ?? null;
    }

    if (validated.data.isActive !== undefined) {
      data.isActive = validated.data.isActive;
    }

    if (
      validated.data.naturalLanguageRule !== undefined &&
      validated.data.naturalLanguageRule !== existingRule.naturalLanguageRule
    ) {
      const parsedRule = await parseAutomationRule(validated.data.naturalLanguageRule);
      data.naturalLanguageRule = validated.data.naturalLanguageRule;
      data.compiledRule = toJsonValue(parsedRule.compiledRule);
      data.triggerType = parsedRule.triggerType;
    }

    const rule = await db.automationRule.update({
      where: { id },
      data,
      include: automationRuleDetailInclude,
    });

    return apiSuccess(serializeAutomationRuleDetail(rule), {
      message: "Automation rule updated successfully",
    });
  } catch (error) {
    console.error("Failed to update automation rule:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update automation rule",
    });
  }
}

export async function DELETE(
  _request: Request,
  context: AutomationRuleRouteContext
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to delete automation rules",
    });
  }

  try {
    const { id } = await context.params;
    const existingRule = await db.automationRule.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!existingRule) {
      return apiError("Not found", {
        status: 404,
        message: "Automation rule not found",
      });
    }

    await db.automationRule.delete({
      where: { id },
    });

    return apiSuccess(null, {
      message: "Automation rule deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete automation rule:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to delete automation rule",
    });
  }
}
