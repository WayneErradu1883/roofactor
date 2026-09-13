import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { prisma } from "@/lib/db";
import CustomerForm from "@/components/customer/CustomerForm";
import ArchiveButton from "@/components/customer/ArchiveButton";

export const dynamic = "force-dynamic";

function money(n: number | null) {
  return n == null
    ? "—"
    : `R ${n.toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
}

const STATUS_STYLE: Record<string, string> = {
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
  OPEN: "bg-amber-100 text-amber-700",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, userId: session.user.id },
    include: {
      estimates: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          quoteNumber: true,
          address: true,
          totalCost: true,
          opportunityStatus: true,
          sentAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!customer) notFound();

  const displayName =
    [customer.title, customer.name, customer.surname]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    customer.email ||
    customer.telephone ||
    "Unnamed customer";

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {customer.customerCode && (
              <span className="rounded bg-primary/10 px-2 py-1 font-mono text-sm text-primary">
                {customer.customerCode}
              </span>
            )}
            <h2 className="text-2xl font-bold">{displayName}</h2>
            {customer.archivedAt && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Archived
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ArchiveButton
              id={customer.id}
              archived={customer.archivedAt != null}
            />
            <Link href="/customers">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm
              customerId={customer.id}
              initial={{
                title: customer.title ?? "",
                name: customer.name ?? "",
                surname: customer.surname ?? "",
                physicalAddress: customer.physicalAddress ?? "",
                telephone: customer.telephone ?? "",
                email: customer.email ?? "",
                notes: customer.notes ?? "",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Quotes ({customer.estimates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {customer.estimates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No quotes yet for this customer.
              </p>
            )}
            {customer.estimates.map((e) => (
              <Link
                key={e.id}
                href={`/estimate/${e.id}`}
                className="block rounded-md border p-3 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {e.quoteNumber ?? "Quote"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLE[e.opportunityStatus] ?? ""
                    }`}
                  >
                    {e.opportunityStatus}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {e.address}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>Total: {money(e.totalCost)}</span>
                  <span>
                    Created: {new Date(e.createdAt).toLocaleString("en-ZA")}
                  </span>
                  <span>
                    Sent:{" "}
                    {e.sentAt
                      ? new Date(e.sentAt).toLocaleString("en-ZA")
                      : "not sent yet"}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
