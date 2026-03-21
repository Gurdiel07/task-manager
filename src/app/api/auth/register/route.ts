import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return apiError("Validation failed", {
        status: 400,
        message: validated.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { name, email, password } = validated.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return apiError("User already exists", {
        status: 409,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return apiSuccess(user, { status: 201, message: "User created successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return apiError("Internal server error", {
      status: 500,
      message: "Something went wrong during registration",
    });
  }
}
