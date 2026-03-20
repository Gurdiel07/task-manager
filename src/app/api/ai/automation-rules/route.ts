import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { parseAutomationRule } from "@/lib/ai/services";
import { serializeAutomationRuleItem } from "@/lib/ai/serializers";
import { automationRuleCreateSchema } from "@/lib/validators/ai";

const automationRulesQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to view automation rules",
    });
  }

  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validated = automationRulesQuerySchema.safeParse(query);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const rules = await db.automationRule.findMany({
      where:
        validated.data.isActive === undefined
          ? undefined
          : { isActive: validated.data.isActive },
      include: {
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
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return apiSuccess(rules.map(serializeAutomationRuleItem));
  } catch (error) {
    console.error("Failed to fetch automation rules:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to fetch automation rules",
    });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", {
      status: 401,
      message: "You must be signed in to create automation rules",
    });
  }

  try {
    const body = await request.json();
    const validated = automationRuleCreateSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((issue) => issue.message).join(", "),
      });
    }

    const parsedRule = await parseAutomationRule(validated.data.naturalLanguageRule);

    const rule = await db.automationRule.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        naturalLanguageRule: validated.data.naturalLanguageRule,
        compiledRule: toJsonValue(parsedRule.compiledRule),
        triggerType: parsedRule.triggerType,
        createdById: session.user.id,
      },
      include: {
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
      },
    });

    return apiSuccess(serializeAutomationRuleItem(rule), {
      status: 201,
      message: "Automation rule created successfully",
    });
  } catch (error) {
    console.error("Failed to create automation rule:", error);
    return apiError("Internal server error", {
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create automation rule",
    });
  }
}
