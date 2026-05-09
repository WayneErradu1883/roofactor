"use client";

import { useEffect, useState, useMemo } from "react";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

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
  user: { name: string; email: string };
}

interface Stats {
  total: number;
  thisMonth: number;
  wonThisMonth: number;
  lostThisMonth: number;
  revenueWon: number;
  pipelineValue: number;
  pipelineCount: number;
  conversionRate: number;
}

type SortField = "date" | "address" | "area" | "cost" | "user";
type SortDir = "asc" | "desc";

function formatZAR(amount: number) {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AdminEstimatesPage() {
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OPEN" | "WON" | "LOST">("ALL");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/estimates");
        if (res.status === 403) {
          setError("Admin access required.");
          return;
        }
        if (!res.ok) {
          setError("Failed to load estimates.");
          return;
        }
        const data = await res.json();
        setEstimates(data.estimates);
        setStats(data.stats);
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = estimates;

    if (filterStatus !== "ALL") {
      result = result.filter((e) => e.opportunityStatus === filterStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.address.toLowerCase().includes(q) ||
          e.user.name.toLowerCase().includes(q) ||
          e.user.email.toLowerCase().includes(q) ||
          (e.customerName?.toLowerCase().includes(q) ?? false)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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
        case "user":
          cmp = a.user.name.localeCompare(b.user.name);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [estimates, search, filterStatus, sortField, sortDir]);

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

  function statusBadge(status: string, reason: string | null) {
    if (status === "WON") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400" title={reason ?? ""}>
          Won
        </span>
      );
    }
    if (status === "LOST") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400" title={reason ?? ""}>
          Lost
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        Open
      </span>
    );
  }

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">All Estimates</h2>
            <p className="text-muted-foreground">Company-wide view across all users</p>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">Back</Button>
          </Link>
        </div>

        {error ? (
          <Card>
            <CardContent className="py-8 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            {/* Stats tiles */}
            {stats && (
              <>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total Estimates</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">{stats.total}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">{stats.thisMonth}</p></CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                    <CardHeader><CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Won This Month</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.wonThisMonth}</p></CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
                    <CardHeader><CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Lost This Month</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.lostThisMonth}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{stats.wonThisMonth + stats.lostThisMonth > 0 ? `${stats.conversionRate}%` : "—"}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                    <CardHeader><CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Revenue Won This Month</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatZAR(stats.revenueWon)}</p></CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
                    <CardHeader><CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Pipeline Value</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatZAR(stats.pipelineValue)}</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">{stats.pipelineCount} open estimate{stats.pipelineCount !== 1 ? "s" : ""}</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Estimates table */}
            <Card className="mt-8">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Estimates</CardTitle>
                    <CardDescription>
                      {estimates.length} total{filtered.length !== estimates.length && ` (${filtered.length} shown)`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="ALL">All Status</option>
                      <option value="OPEN">Open</option>
                      <option value="WON">Won</option>
                      <option value="LOST">Lost</option>
                    </select>
                    <Input
                      placeholder="Search address, customer, user..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No estimates found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 pr-4">
                            <button type="button" className="hover:text-foreground transition-colors" onClick={() => toggleSort("user")}>
                              User{sortIndicator("user")}
                            </button>
                          </th>
                          <th className="pb-2 pr-4">
                            <button type="button" className="hover:text-foreground transition-colors" onClick={() => toggleSort("address")}>
                              Address{sortIndicator("address")}
                            </button>
                          </th>
                          <th className="pb-2 pr-4">
                            <button type="button" className="hover:text-foreground transition-colors" onClick={() => toggleSort("area")}>
                              Area{sortIndicator("area")}
                            </button>
                          </th>
                          <th className="pb-2 pr-4">
                            <button type="button" className="hover:text-foreground transition-colors" onClick={() => toggleSort("cost")}>
                              Cost{sortIndicator("cost")}
                            </button>
                          </th>
                          <th className="pb-2 pr-4">
                            <button type="button" className="hover:text-foreground transition-colors" onClick={() => toggleSort("date")}>
                              Date{sortIndicator("date")}
                            </button>
                          </th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((est) => (
                          <tr
                            key={est.id}
                            className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => (window.location.href = `/estimate/${est.id}`)}
                          >
                            <td className="py-2 pr-4 whitespace-nowrap">
                              <div className="text-sm font-medium">{est.user.name}</div>
                              <div className="text-xs text-muted-foreground">{est.user.email}</div>
                            </td>
                            <td className="py-2 pr-4 max-w-[200px]">
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
                                ? `R${est.totalCost.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "—"}
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {new Date(est.createdAt).toLocaleDateString("en-ZA")}
                            </td>
                            <td className="py-2 whitespace-nowrap">
                              {statusBadge(est.opportunityStatus, est.opportunityReason)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
