import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NavHeader } from "@/components/NavHeader";
import { prisma } from "@/lib/db";
import CustomerList from "@/components/customer/CustomerList";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const customers = await prisma.customer.findMany({
    // Shared company-wide customer list.
    orderBy: [{ pinned: "desc" }, { surname: "asc" }, { name: "asc" }],
    select: {
      id: true,
      customerCode: true,
      title: true,
      name: true,
      surname: true,
      telephone: true,
      email: true,
      pinned: true,
      archivedAt: true,
      estimates: { select: { opportunityStatus: true, createdAt: true } },
    },
  });

  const rows = customers.map((c) => {
    const won = c.estimates.filter(
      (e) => e.opportunityStatus === "WON"
    ).length;
    const last = c.estimates.reduce<Date | null>(
      (acc, e) => (!acc || e.createdAt > acc ? e.createdAt : acc),
      null
    );
    return {
      id: c.id,
      customerCode: c.customerCode,
      title: c.title,
      name: c.name,
      surname: c.surname,
      telephone: c.telephone,
      email: c.email,
      pinned: c.pinned,
      archived: c.archivedAt != null,
      quoteCount: c.estimates.length,
      wonCount: won,
      lastQuotedAt: last ? last.toISOString() : null,
    };
  });

  // Tiles reflect active (non-archived) customers.
  const active = rows.filter((r) => !r.archived);
  const tiles = {
    total: active.length,
    quoted: active.filter((r) => r.quoteCount > 0).length,
    won: active.reduce((s, r) => s + r.wonCount, 0),
  };

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <CustomerList rows={rows} tiles={tiles} />
      </main>
    </>
  );
}
