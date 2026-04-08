import { auth } from "@/lib/auth";
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { queueEmail } from "@/lib/email/send";
import { z } from "zod";

const testEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthorized", { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return apiError("Forbidden", { status: 403, message: "Admin access required" });
  }

  try {
    const body = await parseJsonBody(request);
    const validated = testEmailSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { to, subject, message } = validated.data;

    queueEmail({
      type: "custom",
      to,
      data: { message: message ?? "This is a test email from Task Manager." },
      subject: subject ?? "Test Email from Task Manager",
      html: `<p style="font-family:sans-serif;font-size:15px;color:#3f3f46;">${message ?? "This is a test email from Task Manager."}</p>`,
    });

    return apiSuccess({ sent: true }, { message: "Test email sent successfully" });
  } catch (error) {
    console.error("Failed to queue test email:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Unable to queue test email",
    });
  }
}
