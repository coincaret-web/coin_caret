import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/modules/identity/service/auth.service";
import { registerSchema } from "@/types/user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const result = await registerUser(validated);

    return NextResponse.json(
      {
        message: "Account registered successfully",
        ...result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "An error occurred during registration." },
      { status: 400 }
    );
  }
}
