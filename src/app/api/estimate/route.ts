import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
      userId: session.user.id,
    },
  });

  return NextResponse.json(estimate, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const estimates = await prisma.estimate.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      address: true,
      surfaceAreaM2: true,
      totalCost: true,
      confidenceScore: true,
      createdAt: true,
    },
  });

  return NextResponse.json(estimates);
}
