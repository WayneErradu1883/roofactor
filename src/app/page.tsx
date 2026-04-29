import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [estimates, thisMonth, totalArea] = await Promise.all([
    prisma.estimate.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
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

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Estimates</CardTitle>
            <CardDescription>
              Your latest roof measurements and quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estimates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No estimates yet. Click &quot;New Estimate&quot; to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Address</th>
                      <th className="pb-2 pr-4">Surface Area</th>
                      <th className="pb-2 pr-4">Cost</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimates.map((est) => (
                      <tr key={est.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{est.address}</td>
                        <td className="py-2 pr-4">
                          {est.surfaceAreaM2.toFixed(1)} m²
                        </td>
                        <td className="py-2 pr-4">
                          {est.totalCost
                            ? `R${est.totalCost.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "—"}
                        </td>
                        <td className="py-2">
                          {new Date(est.createdAt).toLocaleDateString("en-ZA")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
