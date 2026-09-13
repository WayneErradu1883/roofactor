"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Row {
  id: string;
  customerCode: string | null;
  title: string | null;
  name: string | null;
  surname: string | null;
  telephone: string | null;
  email: string | null;
  pinned: boolean;
  archived: boolean;
  quoteCount: number;
  wonCount: number;
  lastQuotedAt: string | null;
}

function label(c: Row): string {
  const full = [c.title, c.name, c.surname].filter(Boolean).join(" ").trim();
  return full || c.email || c.telephone || "Unnamed customer";
}

function sortKey(c: Row): string {
  return (c.surname || c.name || c.email || c.telephone || "~").toLowerCase();
}

type SortBy = "az" | "za" | "recent" | "most";

export default function CustomerList({
  rows,
  tiles,
}: {
  rows: Row[];
  tiles: { total: number; quoted: number; won: number };
}) {
  const router = useRouter();
  const [items, setItems] = useState<Row[]>(rows);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("az");
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const archivedCount = items.filter((c) => c.archived).length;

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.ok;
    } finally {
      setBusy(null);
    }
  }

  async function togglePin(id: string, pinned: boolean) {
    if (await patch(id, { pinned: !pinned })) {
      setItems((p) => p.map((c) => (c.id === id ? { ...c, pinned: !pinned } : c)));
    }
  }

  async function toggleArchive(id: string, archived: boolean) {
    if (await patch(id, { archived: !archived })) {
      setItems((p) =>
        p.map((c) =>
          c.id === id ? { ...c, archived: !archived, pinned: false } : c
        )
      );
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter((c) => {
      if (!showArchived && c.archived) return false;
      if (!needle) return true;
      return [c.customerCode, c.name, c.surname, c.email, c.telephone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(needle));
    });
    const cmp = (a: Row, b: Row) => {
      switch (sortBy) {
        case "za":
          return sortKey(b).localeCompare(sortKey(a));
        case "recent":
          return (b.lastQuotedAt ?? "").localeCompare(a.lastQuotedAt ?? "");
        case "most":
          return b.quoteCount - a.quoteCount;
        default:
          return sortKey(a).localeCompare(sortKey(b));
      }
    };
    return [...list].sort(cmp);
  }, [items, q, sortBy, showArchived]);

  const pinned = filtered.filter((c) => c.pinned && !c.archived);
  const rest = filtered.filter((c) => !(c.pinned && !c.archived));

  const tileDefs = [
    { label: "Total Customers", value: tiles.total },
    { label: "Customers Quoted", value: tiles.quoted },
    { label: "Quotes Won", value: tiles.won },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customers</h2>
        <Link href="/customers/new">
          <Button>Add Customer</Button>
        </Link>
      </div>

      {/* Tiles — uniform, brand-coloured, pinned to the top */}
      <div className="sticky top-14 z-40 -mx-4 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="grid gap-4 sm:grid-cols-3">
          {tileDefs.map((t) => (
            <Card key={t.label} className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <p className="text-sm font-medium text-primary">{t.label}</p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {t.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filter + sort */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Filter by code, name, phone or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="az">Name (A–Z)</option>
          <option value="za">Name (Z–A)</option>
          <option value="recent">Recently quoted</option>
          <option value="most">Most quotes</option>
        </select>
        {archivedCount > 0 && (
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-input"
            />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      {pinned.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pinned
          </p>
          <div className="space-y-2">
            {pinned.map((c) => (
              <CustomerRow
                key={c.id}
                c={c}
                busy={busy === c.id}
                onOpen={() => router.push(`/customers/${c.id}`)}
                onPin={() => togglePin(c.id, c.pinned)}
                onArchive={() => toggleArchive(c.id, c.archived)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rest.map((c) => (
          <CustomerRow
            key={c.id}
            c={c}
            busy={busy === c.id}
            onOpen={() => router.push(`/customers/${c.id}`)}
            onPin={() => togglePin(c.id, c.pinned)}
            onArchive={() => toggleArchive(c.id, c.archived)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No customers to show. Click “Add Customer” to capture one.
          </p>
        )}
      </div>
    </div>
  );
}

function CustomerRow({
  c,
  busy,
  onOpen,
  onPin,
  onArchive,
}: {
  c: Row;
  busy: boolean;
  onOpen: () => void;
  onPin: () => void;
  onArchive: () => void;
}) {
  return (
    <Card
      className={`transition-colors hover:border-primary/40 ${
        c.archived ? "opacity-60" : ""
      }`}
    >
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <button onClick={onOpen} className="flex-1 text-left">
          <p className="font-medium">
            {c.customerCode && (
              <span className="mr-2 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                {c.customerCode}
              </span>
            )}
            {label(c)}
            {c.archived && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Archived
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {[c.telephone, c.email].filter(Boolean).join(" · ") ||
              "No contact details"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {c.quoteCount} quote{c.quoteCount !== 1 ? "s" : ""}
            {c.wonCount > 0 ? ` · ${c.wonCount} won` : ""}
          </p>
        </button>
        <div className="flex shrink-0 flex-col gap-1">
          {!c.archived && (
            <Button
              variant={c.pinned ? "default" : "outline"}
              size="sm"
              onClick={onPin}
              disabled={busy}
              title={c.pinned ? "Unpin" : "Pin to top"}
            >
              {c.pinned ? "★ Pinned" : "☆ Pin"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onArchive}
            disabled={busy}
          >
            {c.archived ? "Unarchive" : "Archive"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
