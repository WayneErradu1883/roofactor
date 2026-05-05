"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function NavHeader() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold hover:opacity-80 transition-opacity">
          Roofactor
        </Link>
        {session?.user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/help"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              Help
            </Link>
            {session.user.role === "ADMIN" && (
              <Link
                href="/admin/activity"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
              >
                Activity
              </Link>
            )}
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {session.user.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
