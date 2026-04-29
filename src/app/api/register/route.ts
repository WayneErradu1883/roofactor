import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const { email, name, password } = await req.json();

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const userCount = await prisma.user.count();
  const hashedPassword = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: userCount === 0 ? "ADMIN" : "ESTIMATOR",
    },
  });

  await logAudit({
    action: "user.registered",
    entityType: "user",
    entityId: user.id,
    details: `${name} (${email}) — ${user.role}`,
    userId: user.id,
    userName: name,
  });

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    { status: 201 }
  );
}
