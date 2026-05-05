import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      sessions: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { lastActiveAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          lastActiveAt: true,
          expiresAt: true,
          userAgent: true,
          ipAddress: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}
