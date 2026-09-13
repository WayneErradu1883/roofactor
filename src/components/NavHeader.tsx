"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { RoofIcon } from "@/components/RoofIcon";
import Link from "next/link";

export function NavHeader() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";

  const linkClass =
    "text-sm text-muted-foreground transition-colors hover:text-foreground hidden sm:inline";

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition-opacity"
          >
            <RoofIcon className="size-5 text-primary" />
            Roofactor
          </Link>
          {session?.user && (
            <Link href="/estimate">
              <Button size="sm">New Estimate</Button>
            </Link>
          )}
        </div>

        {session?.user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className={linkClass}>
              Dashboard
            </Link>
            <Link href="/customers" className={linkClass}>
              Customers
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin/estimates" className={linkClass}>
                  All Estimates
                </Link>
                <Link href="/admin/activity" className={linkClass}>
                  Activity
                </Link>
              </>
            )}
            <Link href="/admin/settings" className={linkClass}>
              Settings
            </Link>
            <Link href="/profile" className={linkClass}>
              {session.user.name}
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              ☰ Menu
            </Button>
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

      {/* Slide-out side menu (Help lives here; on small screens it also
          exposes the primary links that are hidden in the top bar). */}
      {open && session?.user && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute right-0 top-0 flex h-full w-64 flex-col bg-card p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              {/* Help is the primary item here */}
              <Link
                href="/help"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Help
              </Link>
              {/* On phones, the top-bar links are hidden — repeat them here */}
              <div className="mt-2 border-t pt-2 sm:hidden">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Dashboard
                </Link>
                <Link
                  href="/customers"
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Customers
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href="/admin/estimates"
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                    >
                      All Estimates
                    </Link>
                    <Link
                      href="/admin/activity"
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                    >
                      Activity
                    </Link>
                  </>
                )}
                <Link
                  href="/admin/settings"
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  Settings
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  {session.user.name}
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
