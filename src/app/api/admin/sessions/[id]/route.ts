import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeSession } from "@/lib/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const revoked = await revokeSession(id, session.user.id, session.user.name);

  if (!revoked) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
