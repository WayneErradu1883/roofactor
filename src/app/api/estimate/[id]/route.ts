import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const estimate = await prisma.estimate.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(estimate);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const estimate = await prisma.estimate.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.estimate.delete({ where: { id } });

  await logAudit({
    action: "estimate.deleted",
    entityType: "estimate",
    entityId: id,
    details: estimate.address,
    userId: session.user.id,
    userName: session.user.name,
  });

  return NextResponse.json({ deleted: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { opportunityStatus, opportunityReason } = body;

  if (
    !opportunityStatus ||
    !["WON", "LOST", "OPEN"].includes(opportunityStatus)
  ) {
    return NextResponse.json(
      { error: "Status must be WON, LOST, or OPEN" },
      { status: 400 }
    );
  }

  // Reason required for WON/LOST, not for reopening
  if (opportunityStatus !== "OPEN" && !opportunityReason?.trim()) {
    return NextResponse.json(
      { error: "A reason is required" },
      { status: 400 }
    );
  }

  const estimate = await prisma.estimate.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.estimate.update({
    where: { id },
    data: {
      opportunityStatus,
      opportunityReason:
        opportunityStatus === "OPEN"
          ? null
          : (opportunityReason?.trim() ?? null),
      opportunityUpdatedAt: new Date(),
    },
  });

  const actionMap: Record<string, "estimate.won" | "estimate.lost" | "estimate.reopened"> = {
    WON: "estimate.won",
    LOST: "estimate.lost",
    OPEN: "estimate.reopened",
  };

  await logAudit({
    action: actionMap[opportunityStatus],
    entityType: "estimate",
    entityId: id,
    details:
      opportunityStatus === "OPEN"
        ? `${estimate.address} — Reopened`
        : `${estimate.address} — ${opportunityReason!.trim()}`,
    userId: session.user.id,
    userName: session.user.name,
  });

  return NextResponse.json(updated);
}
