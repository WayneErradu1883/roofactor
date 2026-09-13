import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { canDeleteEstimates } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN";

  const estimate = await prisma.estimate.findFirst({
    where: { id, ...(isAdmin ? {} : { userId: session.user.id }) },
    include: { customer: true },
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

  // Deleting an estimate is restricted to a single account.
  if (!canDeleteEstimates(session.user.email)) {
    return NextResponse.json(
      { error: "You do not have permission to delete estimates" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const estimate = await prisma.estimate.findUnique({ where: { id } });
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
  const isAdmin = session.user.role === "ADMIN";
  const scope = { id, ...(isAdmin ? {} : { userId: session.user.id }) };
  const body = await req.json();

  const existing = await prisma.estimate.findFirst({ where: scope });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Stamp the first time a quote is sent/downloaded.
  if (body.markSent) {
    const updated = await prisma.estimate.update({
      where: { id },
      data: { sentAt: existing.sentAt ?? new Date() },
    });
    return NextResponse.json(updated);
  }

  // Edit the estimate's editable fields.
  if (body.edit) {
    const num = (v: unknown) =>
      v === null || v === undefined || v === "" ? null : Number(v);
    const updated = await prisma.estimate.update({
      where: { id },
      data: {
        ratePerM2: num(body.ratePerM2),
        totalCost: num(body.totalCost),
        notes: typeof body.notes === "string" ? body.notes : existing.notes,
      },
    });
    return NextResponse.json(updated);
  }

  // Otherwise this is an opportunity (Won/Lost/Open) update.
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

  if (opportunityStatus !== "OPEN" && !opportunityReason?.trim()) {
    return NextResponse.json({ error: "A reason is required" }, { status: 400 });
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

  const actionMap: Record<
    string,
    "estimate.won" | "estimate.lost" | "estimate.reopened"
  > = {
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
        ? `${existing.address} — Reopened`
        : `${existing.address} — ${opportunityReason!.trim()}`,
    userId: session.user.id,
    userName: session.user.name,
  });

  return NextResponse.json(updated);
}
