"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
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

/* ─── Types ────────────────────────────────────────────────────── */
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

interface PdfSettingsData {
  companyName: string;
  companyTagline: string;
  companyLogo: string | null;
  documentTitle: string;
  termsAndConditions: string | null;
  footerText: string;
  quoteValidityDays: number;
  contactPhone: string | null;
  contactEmail: string | null;
}

const DEFAULT_TERMS =
  "This is a Desktop Estimate, pending a Site Visit.\nThis quotation is valid for {validity} days from the date above. Pricing is subject to change following on-site inspection. Final measurements will be confirmed during the site visit.";

/* ─── Page ─────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  /* ── Admin state ── */
  const [users, setUsers] = useState<UserWithSessions[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  /* ── PDF settings state ── */
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfSaving, setPdfSaving] = useState(false);
  const [pdfSaved, setPdfSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [pdf, setPdf] = useState<PdfSettingsData>({
    companyName: "",
    companyTagline: "Professional Roof Coating Solutions",
    companyLogo: null,
    documentTitle: "QUOTATION",
    termsAndConditions: DEFAULT_TERMS,
    footerText: "powered for Nomiplex 2026",
    quoteValidityDays: 30,
    contactPhone: null,
    contactEmail: null,
  });

  /* ── Load admin data ── */
  const loadSessions = useCallback(async () => {
    if (!isAdmin) {
      setAdminLoading(false);
      return;
    }
    setAdminLoading(true);
    try {
      const res = await fetch("/api/admin/sessions");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        setAdminError("Failed to load sessions.");
      }
    } catch {
      setAdminError("Network error.");
    } finally {
      setAdminLoading(false);
    }
  }, [isAdmin]);

  /* ── Load PDF settings ── */
  useEffect(() => {
    loadSessions();
    (async () => {
      try {
        const res = await fetch("/api/settings/pdf");
        if (res.ok) {
          const { settings } = await res.json();
          setPdf({
            companyName: settings.companyName ?? "",
            companyTagline: settings.companyTagline ?? "Professional Roof Coating Solutions",
            companyLogo: settings.companyLogo ?? null,
            documentTitle: settings.documentTitle ?? "QUOTATION",
            termsAndConditions: settings.termsAndConditions ?? DEFAULT_TERMS,
            footerText: settings.footerText ?? "powered for Nomiplex 2026",
            quoteValidityDays: settings.quoteValidityDays ?? 30,
            contactPhone: settings.contactPhone ?? null,
            contactEmail: settings.contactEmail ?? null,
          });
        }
      } catch {
        // defaults
      } finally {
        setPdfLoading(false);
      }
    })();
  }, [loadSessions]);

  /* ── Admin handlers ── */
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
    if (!selectedUserId) { setPasswordError("Select a user."); return; }
    if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }

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

  /* ── PDF handlers ── */
  function updatePdf<K extends keyof PdfSettingsData>(key: K, value: PdfSettingsData[K]) {
    setPdf((prev) => ({ ...prev, [key]: value }));
    setPdfSaved(false);
  }

  async function handleSavePdf() {
    setPdfSaving(true);
    setPdfSaved(false);
    try {
      const res = await fetch("/api/settings/pdf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdf),
      });
      if (res.ok) setPdfSaved(true);
    } catch { /* silent */ } finally {
      setPdfSaving(false);
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Logo must be under 2MB."); return; }
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
    if (!validTypes.includes(file.type)) { alert("Please upload a JPEG, PNG, or SVG file."); return; }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (file.type !== "image/svg+xml") {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          // Fit to max 300x80 while preserving aspect ratio
          const maxW = 300, maxH = 80;
          let w = img.width, h = img.height;
          const scale = Math.min(1, maxW / w, maxH / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          updatePdf("companyLogo", canvas.toDataURL("image/png", 0.9));
          setUploadingLogo(false);
        };
        img.src = dataUrl;
      } else {
        updatePdf("companyLogo", dataUrl);
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  }

  const totalSessions = users.reduce((sum, u) => sum + u.sessions.length, 0);

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-sm text-muted-foreground">
              PDF quote settings{isAdmin ? ", sessions, and user management" : ""}
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">Back</Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* ════════════════════════════════════════════════════════
              PDF QUOTE SETTINGS (all users)
             ════════════════════════════════════════════════════════ */}
          <h3 className="text-lg font-bold border-b pb-2">PDF Quote Settings</h3>

          {pdfLoading ? (
            <p className="text-sm text-muted-foreground">Loading PDF settings...</p>
          ) : (
            <>
              {/* Company Branding */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Branding</CardTitle>
                  <CardDescription>
                    Your company name and logo are placed between the Roofactor header and the document title on the PDF.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo */}
                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      {pdf.companyLogo ? (
                        <div className="flex h-16 w-24 items-center justify-center rounded-md border bg-white p-1">
                          <img src={pdf.companyLogo} alt="Logo" className="max-h-14 max-w-20 object-contain" />
                        </div>
                      ) : (
                        <div className="flex h-16 w-24 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                          No logo
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                            {uploadingLogo ? "Processing..." : "Upload Logo"}
                          </Button>
                          {pdf.companyLogo && (
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => updatePdf("companyLogo", null)}>
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">JPEG, PNG, or SVG. Max 2MB. Auto-resized to fit.</p>
                      </div>
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" value={pdf.companyName} onChange={(e) => updatePdf("companyName", e.target.value)} placeholder="Your company name (shown below Roofactor)" />
                    <p className="text-xs text-muted-foreground">Displayed centered between the Roofactor header and the document title. Leave blank to hide.</p>
                  </div>

                  {/* Tagline */}
                  <div className="space-y-1.5">
                    <Label htmlFor="companyTagline">Tagline / Subtitle</Label>
                    <Input id="companyTagline" value={pdf.companyTagline} onChange={(e) => updatePdf("companyTagline", e.target.value)} placeholder="Shown below Roofactor" />
                  </div>
                </CardContent>
              </Card>

              {/* Document Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document</CardTitle>
                  <CardDescription>Document type label and footer branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="documentTitle">Document Title</Label>
                    <Input id="documentTitle" value={pdf.documentTitle} onChange={(e) => updatePdf("documentTitle", e.target.value)} placeholder='e.g. "QUOTATION", "ESTIMATE"' />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="footerText">Footer Text</Label>
                    <Input id="footerText" value={pdf.footerText} onChange={(e) => updatePdf("footerText", e.target.value)} placeholder="Shown in the bottom footer" />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Details</CardTitle>
                  <CardDescription>Shown in the PDF footer so customers can reach you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input id="contactPhone" type="tel" value={pdf.contactPhone ?? ""} onChange={(e) => updatePdf("contactPhone", e.target.value || null)} placeholder="e.g. 082 123 4567" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactEmail">Email Address</Label>
                    <Input id="contactEmail" type="email" value={pdf.contactEmail ?? ""} onChange={(e) => updatePdf("contactEmail", e.target.value || null)} placeholder="e.g. quotes@yourcompany.co.za" />
                  </div>
                </CardContent>
              </Card>

              {/* Terms & Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Terms &amp; Conditions</CardTitle>
                  <CardDescription>
                    Displayed at the bottom of every PDF quote. Use <code className="rounded bg-muted px-1 text-xs">{"{validity}"}</code> to insert the validity period.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="termsAndConditions">Terms Text</Label>
                    <textarea
                      id="termsAndConditions"
                      value={pdf.termsAndConditions ?? ""}
                      onChange={(e) => updatePdf("termsAndConditions", e.target.value || null)}
                      placeholder="Enter your terms and conditions..."
                      rows={5}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quoteValidityDays">Quote Validity (days)</Label>
                    <Input id="quoteValidityDays" type="number" min={1} max={365} value={pdf.quoteValidityDays} onChange={(e) => updatePdf("quoteValidityDays", parseInt(e.target.value) || 30)} className="w-24" />
                  </div>
                </CardContent>
              </Card>

              {/* Save */}
              <Button onClick={handleSavePdf} disabled={pdfSaving || pdfSaved} className="w-full">
                {pdfSaved ? "Saved!" : pdfSaving ? "Saving..." : "Save PDF Settings"}
              </Button>
              {pdfSaved && (
                <p className="text-center text-sm text-primary">All future PDF quotes will use these settings.</p>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════════
              ADMIN SECTIONS (admin only)
             ════════════════════════════════════════════════════════ */}
          {isAdmin && (
            <>
              <h3 className="text-lg font-bold border-b pb-2 mt-8">Admin</h3>

              {adminError && (
                <Card>
                  <CardContent className="py-8 text-center text-destructive">{adminError}</CardContent>
                </Card>
              )}

              {!adminError && (
                <>
                  {/* Active Sessions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Active Sessions</CardTitle>
                      <CardDescription>
                        {totalSessions} active session{totalSessions !== 1 ? "s" : ""} across {users.length} user{users.length !== 1 ? "s" : ""}. Max 2 per user.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {adminLoading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : (
                        <div className="space-y-4">
                          {users.map((user) => (
                            <div key={user.id} className="rounded-md border p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {user.name}{" "}
                                    <span className="text-muted-foreground">({user.email})</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.role} &middot; {user.sessions.length} active session{user.sessions.length !== 1 ? "s" : ""}
                                  </p>
                                </div>
                                {user.sessions.length > 0 && (
                                  <Button variant="destructive" size="sm" onClick={() => handleRevokeAll(user.id)}>
                                    Revoke All
                                  </Button>
                                )}
                              </div>
                              {user.sessions.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {user.sessions.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs">
                                      <div className="space-y-0.5">
                                        <p>Last active: {new Date(s.lastActiveAt).toLocaleString("en-ZA")}</p>
                                        <p className="text-muted-foreground">
                                          Expires: {new Date(s.expiresAt).toLocaleString("en-ZA")}
                                          {s.ipAddress && ` \u00b7 ${s.ipAddress}`}
                                        </p>
                                      </div>
                                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRevoke(s.id)}>
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
                      <CardDescription>Reset a user&apos;s password. All their sessions will be revoked.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="user-select">User</Label>
                          <select id="user-select" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            <option value="">Select a user...</option>
                            {users.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.email})</option>))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="admin-new-password">New Password</Label>
                          <Input id="admin-new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" className="h-10" minLength={8} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="admin-confirm-password">Confirm Password</Label>
                          <Input id="admin-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="h-10" required />
                        </div>
                        {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                        {passwordMsg && <p className="text-sm text-primary">{passwordMsg}</p>}
                        <Button type="submit" disabled={changingPassword} className="w-full">
                          {changingPassword ? "Changing..." : "Change Password"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Usage Logs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Usage Logs</CardTitle>
                      <CardDescription>View all user activity including logins, estimates, and session events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href="/admin/activity">
                        <Button variant="outline" className="w-full">View Activity Log</Button>
                      </Link>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
