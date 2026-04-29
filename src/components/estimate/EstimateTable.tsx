"use client";

import { useState, useMemo } from "react";
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
  surfaceAreaM2: number;
  totalCost: number | null;
  createdAt: string;
}

interface EstimateTableProps {
  estimates: EstimateRow[];
}

type SortField = "date" | "address" | "area" | "cost";
type SortDir = "asc" | "desc";

export default function EstimateTable({ estimates }: EstimateTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let result = estimates;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.address.toLowerCase().includes(q));
    }

    // Sort
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

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Estimates</CardTitle>
            <CardDescription>
              {estimates.length} total estimate{estimates.length !== 1 ? "s" : ""}
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
                  <th className="pb-2">
                    <button
                      type="button"
                      className="hover:text-foreground transition-colors"
                      onClick={() => toggleSort("date")}
                    >
                      Date{sortIndicator("date")}
                    </button>
                  </th>
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
                    <td className="py-2 pr-4 max-w-[200px] truncate">
                      {est.address}
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
                    <td className="py-2 whitespace-nowrap">
                      {new Date(est.createdAt).toLocaleDateString("en-ZA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
