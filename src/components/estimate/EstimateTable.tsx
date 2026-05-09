"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EstimateRow {
  id: string;
  address: string;
  customerName: string | null;
  customerPhone: string | null;
  surfaceAreaM2: number;
  totalCost: number | null;
  createdAt: string;
  opportunityStatus: "OPEN" | "WON" | "LOST";
  opportunityReason: string | null;
}

interface EstimateTableProps {
  estimates: EstimateRow[];
}

type SortField = "date" | "address" | "area" | "cost";
type SortDir = "asc" | "desc";

export default function EstimateTable({ estimates: initialEstimates }: EstimateTableProps) {
  const [estimates, setEstimates] = useState(initialEstimates);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Opportunity reason modal state
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<"WON" | "LOST" | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    let result = estimates;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.address.toLowerCase().includes(q));
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "address":
          cmp = a.address.localeCompare(b.address);
          break;
        case "area":
          cmp = a.surfaceAreaM2 - b.surfaceAreaM2;
          break;
        case "cost":
          cmp = (a.totalCost ?? 0) - (b.totalCost ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [estimates, search, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function sortIndicator(field: SortField) {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  }

  // Open reason prompt
  const handleStatusClick = useCallback(
    (id: string, status: "WON" | "LOST", e: React.MouseEvent) => {
      e.stopPropagation(); // don't navigate to detail
      setPendingId(id);
      setPendingStatus(status);
      setReason("");
      setError("");
    },
    []
  );

  // Submit status change
  async function handleSubmitStatus() {
    if (!pendingId || !pendingStatus) return;
    if (!reason.trim()) {
      setError("Please enter a reason.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/estimate/${pendingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityStatus: pendingStatus,
          opportunityReason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update.");
        return;
      }

      // Update local state
      setEstimates((prev) =>
        prev.map((est) =>
          est.id === pendingId
            ? {
                ...est,
                opportunityStatus: pendingStatus!,
                opportunityReason: reason.trim(),
              }
            : est
        )
      );

      setPendingId(null);
      setPendingStatus(null);
      setReason("");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  function cancelModal() {
    setPendingId(null);
    setPendingStatus(null);
    setReason("");
    setError("");
  }

  // Reopen handler (no reason needed)
  async function handleReopen(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/estimate/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityStatus: "OPEN" }),
      });
      if (res.ok) {
        setEstimates((prev) =>
          prev.map((est) =>
            est.id === id
              ? { ...est, opportunityStatus: "OPEN" as const, opportunityReason: null }
              : est
          )
        );
      }
    } catch {
      // silent
    }
  }

  function statusBadge(est: EstimateRow) {
    if (est.opportunityStatus === "WON") {
      return (
        <div className="flex items-center gap-1">
          <span
            className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
            title={est.opportunityReason ?? ""}
          >
            Won
          </span>
          <button
            type="button"
            className="rounded-full p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Reopen"
            onClick={(e) => handleReopen(est.id, e)}
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 1 9 9" /><path d="M3 21v-9h9" />
            </svg>
          </button>
        </div>
      );
    }
    if (est.opportunityStatus === "LOST") {
      return (
        <div className="flex items-center gap-1">
          <span
            className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
            title={est.opportunityReason ?? ""}
          >
            Lost
          </span>
          <button
            type="button"
            className="rounded-full p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Reopen"
            onClick={(e) => handleReopen(est.id, e)}
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 1 9 9" /><path d="M3 21v-9h9" />
            </svg>
          </button>
        </div>
      );
    }
    // OPEN — show toggle buttons
    return (
      <div className="flex gap-1">
        <button
          type="button"
          className="rounded-full border border-green-300 bg-white px-2 py-0.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-transparent dark:text-green-400 dark:hover:bg-green-900/30"
          onClick={(e) => handleStatusClick(est.id, "WON", e)}
        >
          Won
        </button>
        <button
          type="button"
          className="rounded-full border border-red-300 bg-white px-2 py-0.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/30"
          onClick={(e) => handleStatusClick(est.id, "LOST", e)}
        >
          Lost
        </button>
      </div>
    );
  }

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Estimates</CardTitle>
              <CardDescription>
                {estimates.length} total estimate
                {estimates.length !== 1 ? "s" : ""}
                {filtered.length !== estimates.length &&
                  ` (${filtered.length} shown)`}
              </CardDescription>
            </div>
            <Input
              placeholder="Search by address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No estimates yet. Click &quot;New Estimate&quot; to get started.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No estimates match &quot;{search}&quot;.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">
                      <button
                        type="button"
                        className="hover:text-foreground transition-colors"
                        onClick={() => toggleSort("address")}
                      >
                        Address{sortIndicator("address")}
                      </button>
                    </th>
                    <th className="pb-2 pr-4">
                      <button
                        type="button"
                        className="hover:text-foreground transition-colors"
                        onClick={() => toggleSort("area")}
                      >
                        Surface Area{sortIndicator("area")}
                      </button>
                    </th>
                    <th className="pb-2 pr-4">
                      <button
                        type="button"
                        className="hover:text-foreground transition-colors"
                        onClick={() => toggleSort("cost")}
                      >
                        Cost{sortIndicator("cost")}
                      </button>
                    </th>
                    <th className="pb-2 pr-4">
                      <button
                        type="button"
                        className="hover:text-foreground transition-colors"
                        onClick={() => toggleSort("date")}
                      >
                        Date{sortIndicator("date")}
                      </button>
                    </th>
                    <th className="pb-2">Opportunity</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((est) => (
                    <tr
                      key={est.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        (window.location.href = `/estimate/${est.id}`)
                      }
                    >
                      <td className="py-2 pr-4 max-w-[250px]">
                        <div className="truncate">{est.address}</div>
                        {est.customerName && (
                          <div className="truncate text-xs text-muted-foreground">
                            {est.customerName}
                            {est.customerPhone && ` \u00b7 ${est.customerPhone}`}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {est.surfaceAreaM2.toFixed(1)} m²
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {est.totalCost
                          ? `R${est.totalCost.toLocaleString("en-ZA", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(est.createdAt).toLocaleDateString("en-ZA")}
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {statusBadge(est)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reason modal overlay */}
      {pendingId && pendingStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={cancelModal}
        >
          <div
            className="mx-4 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">
              Mark as{" "}
              <span
                className={
                  pendingStatus === "WON" ? "text-green-600" : "text-red-600"
                }
              >
                {pendingStatus === "WON" ? "Won" : "Lost"}
              </span>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {pendingStatus === "WON"
                ? "Why did you win this opportunity?"
                : "Why was this opportunity lost?"}
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                pendingStatus === "WON"
                  ? "e.g. Customer accepted quote, competitive pricing..."
                  : "e.g. Customer went with competitor, budget too high..."
              }
              rows={3}
              className="mt-3 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitStatus();
                }
              }}
            />

            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}

            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={cancelModal}>
                Cancel
              </Button>
              <Button
                size="sm"
                className={
                  pendingStatus === "WON"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
                onClick={handleSubmitStatus}
                disabled={saving || !reason.trim()}
              >
                {saving
                  ? "Saving..."
                  : `Mark as ${pendingStatus === "WON" ? "Won" : "Lost"}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
