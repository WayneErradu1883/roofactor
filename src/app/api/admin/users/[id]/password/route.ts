import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { logAudit } from "@/lib/audit";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { newPassword } = await req.json();

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hashedPassword = await hash(newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  // Revoke all sessions for the user to force re-login
  await prisma.session.deleteMany({ where: { userId: id } });

  await logAudit({
    action: "user.password_changed",
    entityType: "user",
    entityId: id,
    details: `Password changed for ${user.name} (${user.email}) by admin. All sessions revoked.`,
    userId: session.user.id,
    userName: session.user.name,
  });

  return NextResponse.json({ success: true });
}
