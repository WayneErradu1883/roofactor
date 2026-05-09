import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EstimateTable from "@/components/estimate/EstimateTable";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const [
    estimates,
    thisMonth,
    totalArea,
    wonThisMonth,
    lostThisMonth,
    revenueWon,
    pipelineValue,
  ] = await Promise.all([
    prisma.estimate.findMany({
      where: { userId: session.user.id },
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
      },
    }),
    prisma.estimate.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: monthStart },
      },
    }),
    prisma.estimate.aggregate({
      where: { userId: session.user.id },
      _sum: { surfaceAreaM2: true },
      _count: true,
    }),
    prisma.estimate.count({
      where: {
        userId: session.user.id,
        opportunityStatus: "WON",
        opportunityUpdatedAt: { gte: monthStart },
      },
    }),
    prisma.estimate.count({
      where: {
        userId: session.user.id,
        opportunityStatus: "LOST",
        opportunityUpdatedAt: { gte: monthStart },
      },
    }),
    // Revenue won this month
    prisma.estimate.aggregate({
      where: {
        userId: session.user.id,
        opportunityStatus: "WON",
        opportunityUpdatedAt: { gte: monthStart },
      },
      _sum: { totalCost: true },
    }),
    // Pipeline value (open estimates)
    prisma.estimate.aggregate({
      where: {
        userId: session.user.id,
        opportunityStatus: "OPEN",
      },
      _sum: { totalCost: true },
      _count: true,
    }),
  ]);

  const totalEstimates = totalArea._count;
  const totalM2 = totalArea._sum.surfaceAreaM2 ?? 0;
  const revenueWonAmount = revenueWon._sum.totalCost ?? 0;
  const pipelineAmount = pipelineValue._sum.totalCost ?? 0;
  const pipelineCount = pipelineValue._count;

  // Conversion rate: Won / (Won + Lost) this month
  const totalDecided = wonThisMonth + lostThisMonth;
  const conversionRate =
    totalDecided > 0 ? Math.round((wonThisMonth / totalDecided) * 100) : 0;

  // Serialize dates for client component
  const serializedEstimates = estimates.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }));

  function formatZAR(amount: number) {
    return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name}
            </p>
          </div>
          <Link href="/estimate">
            <Button>New Estimate</Button>
          </Link>
        </div>

        {/* Row 1: Core stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Estimates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalEstimates}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{thisMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Area Measured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {totalM2.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}{" "}
                m&sup2;
              </p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Won This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                {wonThisMonth}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                Lost This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                {lostThisMonth}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Revenue & pipeline */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Revenue Won This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatZAR(revenueWonAmount)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {totalDecided > 0 ? `${conversionRate}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {wonThisMonth}W / {lostThisMonth}L this month
              </p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {formatZAR(pipelineAmount)}
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                {pipelineCount} open estimate{pipelineCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        <EstimateTable estimates={serializedEstimates} />
      </main>
    </>
  );
}
