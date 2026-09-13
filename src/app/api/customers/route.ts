import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/customers?q=search — used by the estimate customer picker.
export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const customers = await prisma.customer.findMany({
    where: {
      userId: session.user.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { surname: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { telephone: { contains: q, mode: "insensitive" } },
              { physicalAddress: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ pinned: "desc" }, { surname: "asc" }, { name: "asc" }],
    take: 25,
    select: {
      id: true,
      title: true,
      name: true,
      surname: true,
      telephone: true,
      email: true,
      pinned: true,
    },
  });

  return NextResponse.json(customers);
}

// POST /api/customers — create a customer. Every field is optional.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  const customer = await prisma.customer.create({
    data: {
      title: str(body.title),
      name: str(body.name),
      surname: str(body.surname),
      physicalAddress: str(body.physicalAddress),
      telephone: str(body.telephone),
      email: str(body.email),
      notes: str(body.notes),
      userId: session.user.id,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
