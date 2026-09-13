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

  const links: { href: string; label: string }[] = [
    { href: "/", label: "Dashboard" },
    { href: "/customers", label: "Customers" },
    { href: "/estimate", label: "New Estimate" },
    ...(isAdmin
      ? [
          { href: "/admin/estimates", label: "All Estimates" },
          { href: "/admin/activity", label: "Activity" },
        ]
      : []),
    { href: "/admin/settings", label: "Settings" },
    { href: "/help", label: "Help" },
    { href: "/profile", label: session?.user?.name ?? "Profile" },
  ];

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
          <div className="flex items-center gap-2">
            <Link
              href="/customers"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Customers
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              ☰ Menu
            </Button>
          </div>
        )}
      </div>

      {/* Slide-out side menu */}
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
              {links.map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
