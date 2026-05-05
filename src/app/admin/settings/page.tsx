"use client";

import { useEffect, useState, useCallback } from "react";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

interface SessionEntry {
  id: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
}

interface UserWithSessions {
  id: string;
  name: string;
  email: string;
  role: string;
  sessions: SessionEntry[];
}

export default function AdminSettingsPage() {
  const [users, setUsers] = useState<UserWithSessions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Password change state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions");
      if (res.status === 403) {
        setError("Admin access required.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load sessions.");
        return;
      }
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function handleRevoke(sessionId: string) {
    await fetch(`/api/admin/sessions/${sessionId}`, { method: "DELETE" });
    loadSessions();
  }

  async function handleRevokeAll(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    await Promise.all(
      user.sessions.map((s) =>
        fetch(`/api/admin/sessions/${s.id}`, { method: "DELETE" })
      )
    );
    loadSessions();
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (!selectedUserId) {
      setPasswordError("Select a user.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "Failed to change password.");
        return;
      }
      setPasswordMsg("Password changed. All sessions for this user have been revoked.");
      setNewPassword("");
      setConfirmPassword("");
      loadSessions();
    } catch {
      setPasswordError("Network error.");
    } finally {
      setChangingPassword(false);
    }
  }

  const totalSessions = users.reduce((sum, u) => sum + u.sessions.length, 0);

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Admin Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage sessions, passwords, and usage
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back
            </Button>
          </Link>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {!error && (
          <div className="space-y-6">
            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Sessions</CardTitle>
                <CardDescription>
                  {totalSessions} active session{totalSessions !== 1 ? "s" : ""} across {users.length} user{users.length !== 1 ? "s" : ""}. Max 2 per user.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {user.name}{" "}
                              <span className="text-muted-foreground">
                                ({user.email})
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.role} &middot; {user.sessions.length} active session{user.sessions.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {user.sessions.length > 0 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRevokeAll(user.id)}
                            >
                              Revoke All
                            </Button>
                          )}
                        </div>

                        {user.sessions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {user.sessions.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <p>
                                    Last active:{" "}
                                    {new Date(s.lastActiveAt).toLocaleString("en-ZA")}
                                  </p>
                                  <p className="text-muted-foreground">
                                    Expires:{" "}
                                    {new Date(s.expiresAt).toLocaleString("en-ZA")}
                                    {s.ipAddress && ` \u00b7 ${s.ipAddress}`}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleRevoke(s.id)}
                                >
                                  Revoke
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change User Password</CardTitle>
                <CardDescription>
                  Reset a user&apos;s password. All their sessions will be revoked.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="user-select">User</Label>
                    <select
                      id="user-select"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select a user...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="h-10"
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="h-10"
                      required
                    />
                  </div>

                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                  {passwordMsg && (
                    <p className="text-sm text-primary">{passwordMsg}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Usage Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Logs</CardTitle>
                <CardDescription>
                  View all user activity including logins, estimates, and session events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/activity">
                  <Button variant="outline" className="w-full">
                    View Activity Log
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
