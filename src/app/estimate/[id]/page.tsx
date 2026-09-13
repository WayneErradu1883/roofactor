"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PdfDownload from "@/components/estimate/PdfDownload";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { canDeleteEstimates } from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted">
      Loading map...
    </div>
  ),
});

const FootprintOverlay = dynamic(
  () => import("@/components/map/FootprintOverlay"),
  { ssr: false }
);

const FlyToComponent = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.FlyTo),
  { ssr: false }
);

const MarkerComponent = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

interface Customer {
  id: string;
  title: string | null;
  name: string | null;
  surname: string | null;
  telephone: string | null;
  email: string | null;
  physicalAddress: string | null;
}

interface Estimate {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  footprintGeoJSON: string;
  footprintAreaM2: number;
  pitchDegrees: number;
  surfaceAreaM2: number;
  ratePerM2: number | null;
  totalCost: number | null;
  confidenceScore: number | null;
  sourcesUsed: string;
  notes: string | null;
  createdAt: string;
  quoteNumber: string | null;
  sentAt: string | null;
  customerId: string | null;
  customer: Customer | null;
}

function customerName(c: Customer): string {
  return (
    [c.title, c.name, c.surname].filter(Boolean).join(" ").trim() ||
    c.email ||
    c.telephone ||
    "Unnamed customer"
  );
}

interface GeoJSONFeature {
  type: string;
  properties?: {
    zone?: number;
    pitchDegrees?: number;
    footprintAreaM2?: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editRate, setEditRate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/estimate/${params.id}`);
      if (res.ok) {
        setEstimate(await res.json());
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  function startEdit() {
    if (!estimate) return;
    setEditRate(estimate.ratePerM2 != null ? String(estimate.ratePerM2) : "");
    setEditNotes(estimate.notes ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    if (!estimate) return;
    setSavingEdit(true);
    try {
      const rate = editRate === "" ? null : Number(editRate);
      const total = rate != null ? rate * estimate.surfaceAreaM2 : null;
      const res = await fetch(`/api/estimate/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edit: true,
          ratePerM2: rate,
          totalCost: total,
          notes: editNotes,
        }),
      });
      if (res.ok) {
        setEstimate(await res.json());
        setEditing(false);
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this estimate? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/estimate/${params.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/");
    }
    setDeleting(false);
  }

  if (loading) {
    return (
      <>
        <NavHeader />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </>
    );
  }

  if (!estimate) {
    return (
      <>
        <NavHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Estimate not found.</p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </main>
      </>
    );
  }

  // Parse the saved GeoJSON to display polygons
  let polygons: { coordinates: [number, number][]; zone: number; pitch: number; area: number }[] = [];
  try {
    const geoJSON = JSON.parse(estimate.footprintGeoJSON);
    if (geoJSON.type === "FeatureCollection") {
      polygons = geoJSON.features.map((f: GeoJSONFeature, idx: number) => ({
        coordinates: f.geometry.coordinates[0].map(
          (c: number[]) => [c[1], c[0]] as [number, number]
        ),
        zone: f.properties?.zone ?? idx + 1,
        pitch: f.properties?.pitchDegrees ?? estimate.pitchDegrees,
        area: f.properties?.footprintAreaM2 ?? 0,
      }));
    } else if (geoJSON.type === "Polygon") {
      polygons = [
        {
          coordinates: geoJSON.coordinates[0].map(
            (c: number[]) => [c[1], c[0]] as [number, number]
          ),
          zone: 1,
          pitch: estimate.pitchDegrees,
          area: estimate.footprintAreaM2,
        },
      ];
    }
  } catch {
    // Invalid GeoJSON — skip polygon display
  }

  const sources: string[] = (() => {
    try {
      return JSON.parse(estimate.sourcesUsed);
    } catch {
      return [];
    }
  })();

  const confidenceLabel =
    estimate.confidenceScore !== null
      ? estimate.confidenceScore >= 0.9
        ? "High"
        : estimate.confidenceScore >= 0.7
          ? "Medium"
          : "Low"
      : null;

  return (
    <>
      <NavHeader />
      <main className="flex flex-1 flex-col-reverse lg:flex-row">
        {/* Left panel: details */}
        <div className="w-full space-y-4 overflow-y-auto border-r p-4 lg:w-[420px] lg:max-h-[calc(100vh-3.5rem)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Estimate Details</h2>
            <Link href="/">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{estimate.address}</p>
              <p className="text-xs text-muted-foreground">
                {estimate.latitude.toFixed(6)}, {estimate.longitude.toFixed(6)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Created: {new Date(estimate.createdAt).toLocaleString("en-ZA")}
              </p>
              {estimate.quoteNumber && (
                <p className="text-xs text-muted-foreground">
                  Quote: {estimate.quoteNumber}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Sent:{" "}
                {estimate.sentAt
                  ? new Date(estimate.sentAt).toLocaleString("en-ZA")
                  : "not sent yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {estimate.customer ? (
                <Link
                  href={`/customers/${estimate.customer.id}`}
                  className="block hover:opacity-80"
                >
                  <p className="font-medium">
                    {customerName(estimate.customer)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      estimate.customer.telephone,
                      estimate.customer.email,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No contact details"}
                  </p>
                  <p className="mt-1 text-xs text-primary">View customer →</p>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No customer linked.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Measurements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Footprint</p>
                  <p className="text-xl font-bold">
                    {estimate.footprintAreaM2.toFixed(1)} m²
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Surface Area</p>
                  <p className="text-xl font-bold">
                    {estimate.surfaceAreaM2.toFixed(1)} m²
                  </p>
                </div>
              </div>

              {/* Per-zone breakdown */}
              {polygons.length > 1 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Zone Breakdown
                  </p>
                  {polygons.map((p) => (
                    <div
                      key={p.zone}
                      className="flex justify-between rounded border px-2 py-1 text-xs"
                    >
                      <span>Zone {p.zone}</span>
                      <span>{p.pitch}&deg; pitch</span>
                      <span>
                        {p.area.toFixed(1)} m²
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {polygons.length <= 1 && (
                <div className="text-sm text-muted-foreground">
                  Pitch: {estimate.pitchDegrees}&deg;
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Cost Estimate
              </CardTitle>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={startEdit}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="editRate" className="text-xs">
                      Rate per m² (R)
                    </Label>
                    <Input
                      id="editRate"
                      type="number"
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      New total:{" "}
                      {editRate
                        ? `R ${(
                            Number(editRate) * estimate.surfaceAreaM2
                          ).toLocaleString("en-ZA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="editNotes" className="text-xs">
                      Notes
                    </Label>
                    <textarea
                      id="editNotes"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
                      {savingEdit ? "Saving…" : "Save Changes"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Rate:</span>
                    <span>
                      {estimate.ratePerM2 != null
                        ? `R${estimate.ratePerM2.toFixed(2)} / m²`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total:</span>
                    <span>
                      {estimate.totalCost != null
                        ? `R ${estimate.totalCost.toLocaleString("en-ZA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {(confidenceLabel || sources.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Data Quality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {confidenceLabel && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        confidenceLabel === "High"
                          ? "bg-green-500"
                          : confidenceLabel === "Medium"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    />
                    {confidenceLabel} confidence
                  </div>
                )}
                {sources.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Sources: {sources.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {estimate.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{estimate.notes}</p>
              </CardContent>
            </Card>
          )}

          <PdfDownload
            estimate={estimate}
            estimatorName={session?.user?.name ?? "Unknown"}
            customer={estimate.customer}
            onSent={() =>
              setEstimate((prev) =>
                prev && !prev.sentAt
                  ? { ...prev, sentAt: new Date().toISOString() }
                  : prev
              )
            }
          />

          {canDeleteEstimates(session?.user?.email) && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Estimate"}
            </Button>
          )}
        </div>

        {/* Right panel: map */}
        <div className="relative flex-1 min-h-[50vh] lg:min-h-0">
          <MapView
            center={[estimate.latitude, estimate.longitude]}
            zoom={19}
            googleApiKey={undefined}
          >
            <FlyToComponent
              center={[estimate.latitude, estimate.longitude]}
              zoom={19}
            />
            <MarkerComponent position={[estimate.latitude, estimate.longitude]} />
            {polygons.map((p) => (
              <FootprintOverlay
                key={p.zone}
                coordinates={p.coordinates}
                source={`Zone ${p.zone}`}
                areaM2={p.area}
                color="#22c55e"
                visible={true}
              />
            ))}
          </MapView>
        </div>
      </main>
    </>
  );
}
