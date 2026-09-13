"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CustomerLite {
  id: string;
  customerCode?: string | null;
  title: string | null;
  name: string | null;
  surname: string | null;
  telephone: string | null;
  email: string | null;
}

export function customerLabel(c: CustomerLite): string {
  const full = [c.title, c.name, c.surname].filter(Boolean).join(" ").trim();
  return full || c.email || c.telephone || "Unnamed customer";
}

const TITLES = ["", "Mr", "Mrs", "Ms", "Miss", "Dr", "Prof"];

export default function CustomerSelect({
  value,
  onChange,
}: {
  value: CustomerLite | null;
  onChange: (c: CustomerLite | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // quick-add fields
  const [f, setF] = useState({
    title: "",
    name: "",
    surname: "",
    telephone: "",
    email: "",
  });

  const search = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch {
      /* ignore */
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (value) return; // hide search once selected
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, value, search]);

  async function quickAdd() {
    setErr(null);
    if (!f.name && !f.surname && !f.telephone && !f.email) {
      setErr("Enter at least a name, phone, or email.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) throw new Error("Could not save customer");
      const created = await res.json();
      onChange({
        id: created.id,
        customerCode: created.customerCode,
        title: created.title,
        name: created.name,
        surname: created.surname,
        telephone: created.telephone,
        email: created.email,
      });
      setShowAdd(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save customer");
    } finally {
      setSaving(false);
    }
  }

  if (value) {
    return (
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="font-medium">
              {value.customerCode && (
                <span className="mr-2 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                  {value.customerCode}
                </span>
              )}
              {customerLabel(value)}
            </p>
            {(value.telephone || value.email) && (
              <p className="text-xs text-muted-foreground">
                {[value.telephone, value.email].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Customer</Label>
      <Input
        placeholder="Search customers by name, phone or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {searching && (
        <p className="text-xs text-muted-foreground">Searching…</p>
      )}
      {!searching && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c)}
              className="flex w-full flex-col items-start border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted"
            >
              <span className="text-sm font-medium">
                {c.customerCode ? `${c.customerCode} · ` : ""}
                {customerLabel(c)}
              </span>
              {(c.telephone || c.email) && (
                <span className="text-xs text-muted-foreground">
                  {[c.telephone, c.email].filter(Boolean).join(" · ")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {!searching && query && results.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No matching customer. Add them below.
        </p>
      )}

      {!showAdd ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowAdd(true)}
        >
          + New customer
        </Button>
      ) : (
        <div className="space-y-2 rounded-md border p-3">
          <div className="grid grid-cols-3 gap-2">
            <select
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t || "Title"}
                </option>
              ))}
            </select>
            <Input
              placeholder="Name"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              className="col-span-2 h-9"
            />
          </div>
          <Input
            placeholder="Surname"
            value={f.surname}
            onChange={(e) => setF({ ...f, surname: e.target.value })}
            className="h-9"
          />
          <Input
            placeholder="Telephone"
            value={f.telephone}
            onChange={(e) => setF({ ...f, telephone: e.target.value })}
            className="h-9"
          />
          <Input
            placeholder="Email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            className="h-9"
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={quickAdd} disabled={saving}>
              {saving ? "Saving…" : "Save & select"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Full details can be captured later in the CRM.
          </p>
        </div>
      )}
    </div>
  );
}
