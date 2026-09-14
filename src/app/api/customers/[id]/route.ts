import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Customers are shared company-wide, so any signed-in user may open/edit them.
async function ownedCustomer(id: string) {
  return prisma.customer.findUnique({ where: { id } });
}

// GET /api/customers/[id] — customer + the estimates (quotes) linked to them.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id },
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

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(customer);
}

// PATCH /api/customers/[id] — update details, notes, or pin.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await ownedCustomer(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  // Only fields present in the body are touched.
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
  const data: Record<string, unknown> = {};
  for (const f of [
    "title",
    "name",
    "surname",
    "physicalAddress",
    "telephone",
    "email",
    "notes",
  ]) {
    if (has(f)) data[f] = str(body[f]);
  }
  if (has("pinned")) data.pinned = Boolean(body.pinned);
  // Archive / unarchive — the customer keeps its code either way.
  if (has("archived")) data.archivedAt = body.archived ? new Date() : null;

  const updated = await prisma.customer.update({ where: { id }, data });
  return NextResponse.json(updated);
}
