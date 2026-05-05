import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";
import { createSession, validateSession } from "./session";
import { logAudit } from "./audit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        // Create a server-side session and enforce the 2-session limit
        const sessionId = await createSession(user.id, user.name);

        await logAudit({
          action: "user.login",
          entityType: "user",
          entityId: user.id,
          details: `${user.name} (${user.email}) signed in`,
          userId: user.id,
          userName: user.name,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.sessionId = (user as { sessionId: string }).sessionId;
      }

      // On subsequent requests, validate the session is still active
      if (token.sessionId) {
        const valid = await validateSession(token.sessionId as string);
        if (!valid) {
          // Session was revoked or expired — invalidate the JWT
          return {} as typeof token;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sessionId) {
        await prisma.session
          .delete({ where: { id: message.token.sessionId as string } })
          .catch(() => {});
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7200, // 2 hours
  },
});
