"use client";

import { useEffect, useState, useRef } from "react";
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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PdfSettingsData>({
    companyName: "Roofactor",
    companyTagline: "Professional Roof Coating Solutions",
    companyLogo: null,
    documentTitle: "QUOTATION",
    termsAndConditions: DEFAULT_TERMS,
    footerText: "powered for Nomiplex 2026",
    quoteValidityDays: 30,
    contactPhone: null,
    contactEmail: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/pdf");
        if (res.ok) {
          const { settings } = await res.json();
          setForm({
            companyName: settings.companyName ?? "Roofactor",
            companyTagline:
              settings.companyTagline ?? "Professional Roof Coating Solutions",
            companyLogo: settings.companyLogo ?? null,
            documentTitle: settings.documentTitle ?? "QUOTATION",
            termsAndConditions:
              settings.termsAndConditions ?? DEFAULT_TERMS,
            footerText: settings.footerText ?? "powered for Nomiplex 2026",
            quoteValidityDays: settings.quoteValidityDays ?? 30,
            contactPhone: settings.contactPhone ?? null,
            contactEmail: settings.contactEmail ?? null,
          });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateField<K extends keyof PdfSettingsData>(
    key: K,
    value: PdfSettingsData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/pdf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSaved(true);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo must be under 2MB.");
      return;
    }

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a JPEG, PNG, or SVG file.");
      return;
    }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // For raster images, resize to max 300px wide for PDF
      if (file.type !== "image/svg+xml") {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxW = 300;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const resized = canvas.toDataURL("image/png", 0.9);
          updateField("companyLogo", resized);
          setUploadingLogo(false);
        };
        img.src = dataUrl;
      } else {
        updateField("companyLogo", dataUrl);
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <NavHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">PDF Quote Settings</h2>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back
            </Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        ) : (
          <div className="space-y-6">
            {/* Company Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Branding</CardTitle>
                <CardDescription>
                  Logo and company name shown in the PDF header
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo */}
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    {form.companyLogo ? (
                      <div className="flex size-16 items-center justify-center rounded-md border bg-white p-1">
                        <img
                          src={form.companyLogo}
                          alt="Logo"
                          className="max-h-14 max-w-14 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-md border bg-muted text-2xl">
                        {"\u2302"}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? "Processing..." : "Upload Logo"}
                        </Button>
                        {form.companyLogo && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => updateField("companyLogo", null)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        JPEG, PNG, or SVG. Max 2MB. Displayed between company
                        name and document title.
                      </p>
                    </div>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="Your company name"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-1.5">
                  <Label htmlFor="companyTagline">Tagline / Subtitle</Label>
                  <Input
                    id="companyTagline"
                    value={form.companyTagline}
                    onChange={(e) =>
                      updateField("companyTagline", e.target.value)
                    }
                    placeholder="Shown below company name"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document</CardTitle>
                <CardDescription>
                  Document type label and footer branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="documentTitle">Document Title</Label>
                  <Input
                    id="documentTitle"
                    value={form.documentTitle}
                    onChange={(e) =>
                      updateField("documentTitle", e.target.value)
                    }
                    placeholder='e.g. "QUOTATION", "ESTIMATE", "INVOICE"'
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input
                    id="footerText"
                    value={form.footerText}
                    onChange={(e) => updateField("footerText", e.target.value)}
                    placeholder="Shown in the bottom footer"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Details</CardTitle>
                <CardDescription>
                  Shown in the PDF footer so customers can reach you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={form.contactPhone ?? ""}
                    onChange={(e) =>
                      updateField("contactPhone", e.target.value || null)
                    }
                    placeholder="e.g. 082 123 4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Email Address</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={form.contactEmail ?? ""}
                    onChange={(e) =>
                      updateField("contactEmail", e.target.value || null)
                    }
                    placeholder="e.g. quotes@yourcompany.co.za"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Terms &amp; Conditions</CardTitle>
                <CardDescription>
                  Displayed at the bottom of every PDF quote. Use{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    {"{validity}"}
                  </code>{" "}
                  to insert the validity period.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="termsAndConditions">Terms Text</Label>
                  <textarea
                    id="termsAndConditions"
                    value={form.termsAndConditions ?? ""}
                    onChange={(e) =>
                      updateField(
                        "termsAndConditions",
                        e.target.value || null
                      )
                    }
                    placeholder="Enter your terms and conditions..."
                    rows={5}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quoteValidityDays">
                    Quote Validity (days)
                  </Label>
                  <Input
                    id="quoteValidityDays"
                    type="number"
                    min={1}
                    max={365}
                    value={form.quoteValidityDays}
                    onChange={(e) =>
                      updateField(
                        "quoteValidityDays",
                        parseInt(e.target.value) || 30
                      )
                    }
                    className="w-24"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview & Save */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex-1"
              >
                {saved ? "Saved!" : saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>

            {saved && (
              <p className="text-center text-sm text-primary">
                Settings saved. All future PDF quotes will use these values.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
