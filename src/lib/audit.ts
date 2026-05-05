import { prisma } from "./db";

export type AuditAction =
  | "estimate.created"
  | "estimate.deleted"
  | "user.registered"
  | "user.login"
  | "session.revoked"
  | "session.limit_exceeded"
  | "user.password_changed";

export async function logAudit({
  action,
  entityType,
  entityId,
  details,
  userId,
  userName,
}: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: string;
  userId: string;
  userName: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId: entityId ?? null,
        details: details ?? null,
        userId,
        userName,
      },
    });
  } catch {
    // Audit logging should never break the main flow
    console.error("Failed to write audit log");
  }
}
