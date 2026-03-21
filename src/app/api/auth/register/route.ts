import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";
import type { ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Validation failed",
          message: validated.error.issues.map((i) => i.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "User already exists",
          message: "An account with this email already exists",
        },
        { status: 409 }
      );
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

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: user,
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
        message: "Something went wrong during registration",
      },
      { status: 500 }
    );
  }
}
