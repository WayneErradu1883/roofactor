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
import { pitchMultiplier } from "@/lib/calc/pitch";
import PdfDownload from "@/components/estimate/PdfDownload";
import Link from "next/link";
import { useSession } from "next-auth/react";

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
                {new Date(estimate.createdAt).toLocaleString("en-ZA")}
              </p>
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
                        {p.area.toFixed(1)} m² x{pitchMultiplier(p.pitch).toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {polygons.length <= 1 && (
                <div className="text-sm text-muted-foreground">
                  Pitch: {estimate.pitchDegrees}&deg; (x
                  {pitchMultiplier(estimate.pitchDegrees).toFixed(3)})
                </div>
              )}
            </CardContent>
          </Card>

          {(estimate.ratePerM2 || estimate.totalCost) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Cost Estimate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-3 space-y-1">
                  {estimate.ratePerM2 && (
                    <div className="flex justify-between text-sm">
                      <span>Rate:</span>
                      <span>R{estimate.ratePerM2.toFixed(2)} / m²</span>
                    </div>
                  )}
                  {estimate.totalCost && (
                    <div className="flex justify-between font-bold text-sm">
                      <span>Total:</span>
                      <span>
                        R
                        {estimate.totalCost.toLocaleString("en-ZA", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
          />

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Estimate"}
          </Button>
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
