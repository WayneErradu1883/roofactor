"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { RoofIcon } from "@/components/RoofIcon";
import Link from "next/link";

export function NavHeader() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition-opacity">
          <RoofIcon className="size-5 text-primary" />
          Roofactor
        </Link>
        {session?.user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              Dashboard
            </Link>
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
            <Link
              href="/admin/settings"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              Settings
            </Link>
            <Link
              href="/profile"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {session.user.name}
            </Link>
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
