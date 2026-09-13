"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CustomerData {
  title: string;
  name: string;
  surname: string;
  physicalAddress: string;
  telephone: string;
  email: string;
  notes: string;
}

const TITLES = ["", "Mr", "Mrs", "Ms", "Miss", "Dr", "Prof"];

const EMPTY: CustomerData = {
  title: "",
  name: "",
  surname: "",
  physicalAddress: "",
  telephone: "",
  email: "",
  notes: "",
};

export default function CustomerForm({
  customerId,
  initial,
}: {
  customerId?: string;
  initial?: Partial<CustomerData>;
}) {
  const router = useRouter();
  const [f, setF] = useState<CustomerData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof CustomerData, v: string) =>
    setF((prev) => ({ ...prev, [k]: v }));

  // Google Maps address validation
  const [validating, setValidating] = useState(false);
  const [addrStatus, setAddrStatus] = useState<"idle" | "valid" | "invalid">(
    "idle"
  );
  const [addrMsg, setAddrMsg] = useState("");

  async function validateAddress() {
    if (!f.physicalAddress.trim()) return;
    setValidating(true);
    setAddrStatus("idle");
    setAddrMsg("");
    try {
      const res = await fetch(
        `/api/geocode?address=${encodeURIComponent(f.physicalAddress)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setAddrStatus("invalid");
        setAddrMsg(
          data.error === "Address not found"
            ? "Google Maps couldn't find that address. Please check it."
            : data.error || "Could not validate the address."
        );
        return;
      }
      // Replace with Google's official formatting so it's consistent.
      setF((prev) => ({ ...prev, physicalAddress: data.formatted_address }));
      setAddrStatus("valid");
    } catch {
      setAddrStatus("invalid");
      setAddrMsg("Network error while validating. Please try again.");
    } finally {
      setValidating(false);
    }
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        customerId ? `/api/customers/${customerId}` : "/api/customers",
        {
          method: customerId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(f),
        }
      );
      if (!res.ok) throw new Error("Could not save the customer.");
      const data = await res.json();
      if (!customerId) {
        router.push(`/customers/${data.id}`);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the customer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Title</Label>
          <select
            value={f.title}
            onChange={(e) => set("title", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {TITLES.map((t) => (
              <option key={t} value={t}>
                {t || "—"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Surname</Label>
          <Input
            value={f.surname}
            onChange={(e) => set("surname", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Physical Address</Label>
        <textarea
          value={f.physicalAddress}
          onChange={(e) => {
            set("physicalAddress", e.target.value);
            setAddrStatus("idle");
          }}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={validateAddress}
            disabled={!f.physicalAddress.trim() || validating}
          >
            {validating ? "Validating…" : "Validate with Google Maps"}
          </Button>
          {addrStatus === "valid" && (
            <span className="text-xs font-medium text-green-600">
              ✓ Address validated
            </span>
          )}
          {addrStatus === "invalid" && (
            <span className="text-xs text-destructive">{addrMsg}</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Telephone</Label>
          <Input
            type="tel"
            value={f.telephone}
            onChange={(e) => set("telephone", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input
            type="email"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Notes (internal only — never shown on a quote)</Label>
        <textarea
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <p className="text-xs text-muted-foreground">All fields are optional.</p>

      <Button onClick={save} disabled={saving}>
        {saving
          ? "Saving…"
          : saved
            ? "Saved!"
            : customerId
              ? "Save Changes"
              : "Save Customer"}
      </Button>
    </div>
  );
}
