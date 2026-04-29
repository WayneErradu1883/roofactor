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

  const [estimates, thisMonth, totalArea] = await Promise.all([
    prisma.estimate.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        address: true,
        surfaceAreaM2: true,
        totalCost: true,
        createdAt: true,
      },
    }),
    prisma.estimate.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.estimate.aggregate({
      where: { userId: session.user.id },
      _sum: { surfaceAreaM2: true },
      _count: true,
    }),
  ]);

  const totalEstimates = totalArea._count;
  const totalM2 = totalArea._sum.surfaceAreaM2 ?? 0;

  // Serialize dates for client component
  const serializedEstimates = estimates.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }));

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

        <div className="grid gap-4 md:grid-cols-3">
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
                {totalM2.toLocaleString("en-ZA", { maximumFractionDigits: 0 })} m&sup2;
              </p>
            </CardContent>
          </Card>
        </div>

        <EstimateTable estimates={serializedEstimates} />
      </main>
    </>
  );
}
