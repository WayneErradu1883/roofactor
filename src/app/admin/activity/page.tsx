"use client";

import { useEffect, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  userId: string;
  userName: string;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  "estimate.created": "Created estimate",
  "estimate.deleted": "Deleted estimate",
  "user.registered": "User registered",
  "user.login": "User logged in",
};

const actionColors: Record<string, string> = {
  "estimate.created": "bg-green-100 text-green-800",
  "estimate.deleted": "bg-red-100 text-red-800",
  "user.registered": "bg-blue-100 text-blue-800",
  "user.login": "bg-gray-100 text-gray-800",
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/audit?limit=${limit}&offset=${offset}`
        );
        if (res.status === 403) {
          setError("Admin access required.");
          return;
        }
        if (!res.ok) {
          setError("Failed to load audit log.");
          return;
        }
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [offset]);

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Activity Log</h2>
            <p className="text-sm text-muted-foreground">
              {total} total events
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back
            </Button>
          </Link>
        </div>

        {error && (
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {loading && !error && (
          <p className="text-muted-foreground">Loading...</p>
        )}

        {!loading && !error && logs.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No activity logged yet.
            </CardContent>
          </Card>
        )}

        {!loading && !error && logs.length > 0 && (
          <>
            <div className="space-y-2">
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="flex items-start gap-3 py-3">
                    <span
                      className={`mt-0.5 rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                        actionColors[log.action] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {actionLabels[log.action] || log.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{log.userName}</span>
                        {log.details && (
                          <span className="text-muted-foreground">
                            {" — "}
                            {log.details}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("en-ZA")}
                      </p>
                    </div>
                    {log.entityId && log.entityType === "estimate" && (
                      <Link href={`/estimate/${log.entityId}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {offset + 1}–{Math.min(offset + limit, total)} of {total}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + limit >= total}
                  onClick={() => setOffset(offset + limit)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
