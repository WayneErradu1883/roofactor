import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const [estimates, wonThisMonth, lostThisMonth, revenueWon, pipelineValue] =
    await Promise.all([
      prisma.estimate.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          address: true,
          customerName: true,
          customerPhone: true,
          surfaceAreaM2: true,
          totalCost: true,
          createdAt: true,
          opportunityStatus: true,
          opportunityReason: true,
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.estimate.count({
        where: {
          opportunityStatus: "WON",
          opportunityUpdatedAt: { gte: monthStart },
        },
      }),
      prisma.estimate.count({
        where: {
          opportunityStatus: "LOST",
          opportunityUpdatedAt: { gte: monthStart },
        },
      }),
      prisma.estimate.aggregate({
        where: {
          opportunityStatus: "WON",
          opportunityUpdatedAt: { gte: monthStart },
        },
        _sum: { totalCost: true },
      }),
      prisma.estimate.aggregate({
        where: { opportunityStatus: "OPEN" },
        _sum: { totalCost: true },
        _count: true,
      }),
    ]);

  const totalDecided = wonThisMonth + lostThisMonth;

  return NextResponse.json({
    estimates,
    stats: {
      total: estimates.length,
      thisMonth: estimates.filter(
        (e) => new Date(e.createdAt) >= monthStart
      ).length,
      wonThisMonth,
      lostThisMonth,
      revenueWon: revenueWon._sum.totalCost ?? 0,
      pipelineValue: pipelineValue._sum.totalCost ?? 0,
      pipelineCount: pipelineValue._count,
      conversionRate:
        totalDecided > 0
          ? Math.round((wonThisMonth / totalDecided) * 100)
          : 0,
    },
  });
}
