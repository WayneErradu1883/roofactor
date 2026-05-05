import { prisma } from "./db";
import { logAudit } from "./audit";

const MAX_SESSIONS = 2;
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export async function cleanExpiredSessions(userId: string) {
  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });
}

export async function createSession(
  userId: string,
  userName: string,
  metadata?: { userAgent?: string; ipAddress?: string }
) {
  await cleanExpiredSessions(userId);

  const activeSessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (activeSessions.length >= MAX_SESSIONS) {
    const toRevoke = activeSessions.slice(
      0,
      activeSessions.length - MAX_SESSIONS + 1
    );
    await prisma.session.deleteMany({
      where: { id: { in: toRevoke.map((s) => s.id) } },
    });

    await logAudit({
      action: "session.limit_exceeded",
      entityType: "session",
      entityId: toRevoke[0].id,
      details: `Oldest session revoked — concurrent limit of ${MAX_SESSIONS} reached`,
      userId,
      userName,
    });
  }

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      userAgent: metadata?.userAgent || null,
      ipAddress: metadata?.ipAddress || null,
    },
  });

  return session.id;
}

export async function validateSession(
  sessionId: string
): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) return false;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    return false;
  }

  // Throttle lastActiveAt updates to avoid DB write on every request
  const sinceLastActive =
    Date.now() - session.lastActiveAt.getTime();
  if (sinceLastActive > ACTIVITY_THROTTLE_MS) {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });
  }

  return true;
}

export async function revokeSession(
  sessionId: string,
  adminUserId: string,
  adminUserName: string
) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!session) return false;

  await prisma.session.delete({ where: { id: sessionId } });

  await logAudit({
    action: "session.revoked",
    entityType: "session",
    entityId: sessionId,
    details: `Revoked session for ${session.user.name} (${session.user.email})`,
    userId: adminUserId,
    userName: adminUserName,
  });

  return true;
}
