import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    address,
    latitude,
    longitude,
    footprintGeoJSON,
    footprintAreaM2,
    pitchDegrees,
    surfaceAreaM2,
    ratePerM2,
    totalCost,
    confidenceScore,
    sourcesUsed,
    notes,
    customerId,
  } = body;

  if (
    !address ||
    latitude === undefined ||
    longitude === undefined ||
    !footprintGeoJSON ||
    footprintAreaM2 === undefined ||
    pitchDegrees === undefined ||
    surfaceAreaM2 === undefined
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // A customer must be captured in the CRM first and selected here.
  if (!customerId) {
    return NextResponse.json(
      { error: "Please select a customer for this estimate" },
      { status: 400 }
    );
  }
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 400 });
  }

  // Stable quote number, issued once at save and reused for every PDF.
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  const quoteNumber = `NP-QUOTE-${dd}${mm}-${rand}`;

  const customerFullName = [customer.name, customer.surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  const estimate = await prisma.estimate.create({
    data: {
      address,
      latitude,
      longitude,
      footprintGeoJSON,
      footprintAreaM2,
      pitchDegrees,
      surfaceAreaM2,
      ratePerM2: ratePerM2 ?? null,
      totalCost: totalCost ?? null,
      confidenceScore: confidenceScore ?? null,
      sourcesUsed: sourcesUsed ?? "[]",
      notes: notes ?? null,
      quoteNumber,
      customerId: customer.id,
      // Denormalised for display/PDF; kept in sync from the CRM record.
      customerName: customerFullName || null,
      customerPhone: customer.telephone ?? null,
      userId: session.user.id,
    },
  });

  await logAudit({
    action: "estimate.created",
    entityType: "estimate",
    entityId: estimate.id,
    details: `${address} — ${surfaceAreaM2.toFixed(1)} m²`,
    userId: session.user.id,
    userName: session.user.name,
  });

  return NextResponse.json(estimate, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const estimates = await prisma.estimate.findMany({
    // Estimates are shared company-wide.
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      address: true,
      surfaceAreaM2: true,
      totalCost: true,
      confidenceScore: true,
      createdAt: true,
      quoteNumber: true,
      customerName: true,
      opportunityStatus: true,
    },
  });

  return NextResponse.json(estimates);
}
