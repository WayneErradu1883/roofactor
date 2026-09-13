import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { customerCodeLetter, nextCustomerCode } from "@/lib/customer-code";

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
      archivedAt: null, // archived customers aren't offered for new quotes
      ...(q
        ? {
            OR: [
              { customerCode: { contains: q, mode: "insensitive" } },
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
      customerCode: true,
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

  const data = {
    title: str(body.title),
    name: str(body.name),
    surname: str(body.surname),
    physicalAddress: str(body.physicalAddress),
    telephone: str(body.telephone),
    email: str(body.email),
    notes: str(body.notes),
    userId: session.user.id,
  };

  const letter = customerCodeLetter(data.name, data.surname, data.email);

  // Allocate a unique code; retry if two customers race for the same one.
  let customer;
  for (let attempt = 0; ; attempt++) {
    const customerCode = await nextCustomerCode(letter);
    try {
      customer = await prisma.customer.create({
        data: { ...data, customerCode },
      });
      break;
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "P2002" && attempt < 4) continue; // unique clash → retry
      throw e;
    }
  }

  return NextResponse.json(customer, { status: 201 });
}
