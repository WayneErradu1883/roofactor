"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { NavHeader } from "@/components/NavHeader";
import AddressSearch, {
  type GeocodedAddress,
} from "@/components/estimate/AddressSearch";
import AreaResult from "@/components/estimate/AreaResult";
import QuoteCalc from "@/components/estimate/QuoteCalc";
import ZoneList, { type ZonePitch } from "@/components/estimate/ZoneList";
import SourceComparison from "@/components/estimate/SourceComparison";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calculateSurfaceArea } from "@/lib/calc/pitch";
import type { ZoneData } from "@/components/map/PolygonEditor";
import Link from "next/link";

// Dynamic imports for Leaflet (no SSR)
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted">
      Loading map...
    </div>
  ),
});

const PolygonEditor = dynamic(
  () => import("@/components/map/PolygonEditor"),
  { ssr: false }
);

const FootprintOverlay = dynamic(
  () => import("@/components/map/FootprintOverlay"),
  { ssr: false }
);

const FlyToComponent = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.FlyTo),
  { ssr: false }
);

interface FootprintSource {
  coordinates: [number, number][];
  areaM2: number;
  source: string;
}

interface SolarPitchData {
  avgPitchDegrees: number;
  dominantPitchDegrees: number;
  segments: { pitchDegrees: number; azimuthDegrees: number; areaM2: number }[];
  totalRoofAreaM2: number;
  imageryQuality: string;
}

interface FootprintResponse {
  microsoft: FootprintSource | null;
  osm: FootprintSource | null;
  solarPitch: SolarPitchData | null;
  confidence: "high" | "medium" | "low";
  discrepancy: number | null;
  sourcesAvailable: string[];
}

// Default center: South Africa
const SA_CENTER: [number, number] = [-28.4793, 24.6727];
const SA_ZOOM = 6;
const BUILDING_ZOOM = 19;

export default function EstimatePage() {
  const [geocoded, setGeocoded] = useState<GeocodedAddress | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(SA_CENTER);
  const [mapZoom, setMapZoom] = useState(SA_ZOOM);
  const [footprints, setFootprints] = useState<FootprintResponse | null>(null);
  const [footprintLoading, setFootprintLoading] = useState(false);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [zonePitches, setZonePitches] = useState<ZonePitch[]>([]);
  const [ratePerM2, setRatePerM2] = useState(150);
  const [showMicrosoft, setShowMicrosoft] = useState(true);
  const [showOSM, setShowOSM] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);

  // Calculate totals across all zones
  const totals = useMemo(() => {
    if (zones.length === 0) return { footprint: null, surface: null };
    const footprint = zones.reduce((sum, z) => sum + z.areaM2, 0);
    const surface = zones.reduce((sum, z) => {
      const pitch =
        zonePitches.find((p) => p.zoneId === z.id)?.pitchDegrees ?? 22.5;
      return sum + calculateSurfaceArea(z.areaM2, pitch);
    }, 0);
    return { footprint, surface };
  }, [zones, zonePitches]);

  const handleAddressFound = useCallback(async (result: GeocodedAddress) => {
    setGeocoded(result);
    setMapCenter([result.lat, result.lng]);
    setMapZoom(BUILDING_ZOOM);
    setZones([]);
    setZonePitches([]);
    setSaved(false);
    setNotes("");

    // Fetch building footprints and solar pitch data
    setFootprintLoading(true);
    setDetectedPitch(null);
    try {
      const res = await fetch(
        `/api/footprint?lat=${result.lat}&lng=${result.lng}`
      );
      if (res.ok) {
        const data = await res.json();
        setFootprints(data);
        if (data.solarPitch) {
          setDetectedPitch(data.solarPitch.dominantPitchDegrees);
        }
      }
    } catch {
      // Footprints are optional
    } finally {
      setFootprintLoading(false);
    }
  }, []);

  const handleZonesChange = useCallback(
    (newZones: ZoneData[]) => {
      setZones(newZones);
      setSaved(false);

      // Add pitch for new zones — use detected pitch from Solar API if available
      setZonePitches((prev) => {
        const updated = [...prev];
        for (const zone of newZones) {
          if (!updated.find((p) => p.zoneId === zone.id)) {
            updated.push({
              zoneId: zone.id,
              pitchDegrees: detectedPitch ?? 22.5,
            });
          }
        }
        // Remove pitches for deleted zones
        return updated.filter((p) =>
          newZones.some((z) => z.id === p.zoneId)
        );
      });
    },
    [detectedPitch]
  );

  const handlePitchChange = useCallback(
    (zoneId: string, pitchDegrees: number) => {
      setZonePitches((prev) =>
        prev.map((p) =>
          p.zoneId === zoneId ? { ...p, pitchDegrees } : p
        )
      );
      setSaved(false);
    },
    []
  );

  const handleApplyPitchToAll = useCallback(
    (pitchDegrees: number) => {
      setZonePitches((prev) =>
        prev.map((p) => ({ ...p, pitchDegrees }))
      );
      setSaved(false);
    },
    []
  );

  const [preferredSource, setPreferredSource] = useState<"microsoft" | "osm" | null>(null);

  async function handleSave() {
    if (!geocoded || zones.length === 0 || totals.surface === null) return;

    setSaving(true);
    try {
      // Build multi-zone GeoJSON
      const geoJSON = {
        type: "FeatureCollection",
        features: zones.map((z, idx) => ({
          type: "Feature",
          properties: {
            zone: idx + 1,
            pitchDegrees:
              zonePitches.find((p) => p.zoneId === z.id)?.pitchDegrees ?? 22.5,
            footprintAreaM2: z.areaM2,
          },
          geometry: {
            type: "Polygon",
            coordinates: [z.latlngs.map((ll) => [ll[1], ll[0]])],
          },
        })),
      };

      // Use the average pitch for the DB record (individual zones stored in GeoJSON)
      const avgPitch =
        zonePitches.reduce((sum, p) => sum + p.pitchDegrees, 0) /
        (zonePitches.length || 1);

      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: geocoded.formatted_address,
          latitude: geocoded.lat,
          longitude: geocoded.lng,
          footprintGeoJSON: JSON.stringify(geoJSON),
          footprintAreaM2: totals.footprint,
          pitchDegrees: Math.round(avgPitch * 10) / 10,
          surfaceAreaM2: totals.surface,
          ratePerM2,
          totalCost: totals.surface * ratePerM2,
          confidenceScore:
            footprints?.confidence === "high"
              ? 0.95
              : footprints?.confidence === "medium"
                ? 0.75
                : 0.5,
          sourcesUsed: JSON.stringify(footprints?.sourcesAvailable || []),
          notes: notes || null,
        }),
      });

      if (res.ok) {
        setSaved(true);
      }
    } catch {
      // handle silently
    } finally {
      setSaving(false);
    }
  }

  // Ctrl+S to save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (zones.length > 0 && totals.surface !== null && !saving && !saved) {
          handleSave();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <>
      <NavHeader />
      <main className="flex flex-1 flex-col-reverse lg:flex-row">
        {/* Left panel: controls */}
        <div className="w-full space-y-4 overflow-y-auto border-r p-4 lg:w-[420px] lg:max-h-[calc(100vh-3.5rem)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">New Estimate</h2>
            <Link href="/">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
          </div>

          <AddressSearch onAddressFound={handleAddressFound} />

          {geocoded && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">{geocoded.formatted_address}</p>
              <p className="text-xs text-muted-foreground">
                {geocoded.lat.toFixed(6)}, {geocoded.lng.toFixed(6)}
              </p>
            </div>
          )}

          {footprintLoading && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Searching for building footprints...
            </div>
          )}

          {footprints?.solarPitch && !footprintLoading && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="font-medium text-primary">
                Roof pitch auto-detected: {footprints.solarPitch.dominantPitchDegrees}&deg;
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {footprints.solarPitch.segments.length} segment{footprints.solarPitch.segments.length !== 1 ? "s" : ""} detected
                via Google Solar API ({footprints.solarPitch.imageryQuality} quality).
                Pitch will be applied automatically when you draw polygons.
              </p>
            </div>
          )}

          {footprints && !footprintLoading && (
            <SourceComparison
              microsoft={footprints.microsoft}
              osm={footprints.osm}
              confidence={footprints.confidence}
              discrepancy={footprints.discrepancy}
              showMicrosoft={showMicrosoft}
              showOSM={showOSM}
              onToggleMicrosoft={setShowMicrosoft}
              onToggleOSM={setShowOSM}
              onSelectSource={(source) => {
                setPreferredSource(source);
                setZones([]);
                setZonePitches([]);
                setEditorKey((k) => k + 1);
              }}
            />
          )}

          {geocoded && (
            <>
              {zones.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Use the polygon tool on the map to trace the roof outline. The orange/blue overlays show detected building footprints for reference. Draw multiple polygons for complex roofs with different pitches.
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => {
                    setZones([]);
                    setZonePitches([]);
                    setSaved(false);
                    setEditorKey((k) => k + 1);
                  }}
                >
                  Reset Map Selection
                </Button>
              )}

              <ZoneList
                zones={zones}
                zonePitches={zonePitches}
                onPitchChange={handlePitchChange}
                onApplyPitchToAll={handleApplyPitchToAll}
              />

              <AreaResult
                totalFootprintM2={totals.footprint}
                totalSurfaceM2={totals.surface}
                zoneCount={zones.length}
                confidence={footprints?.confidence ?? null}
                discrepancy={footprints?.discrepancy ?? null}
                sourcesUsed={footprints?.sourcesAvailable ?? []}
              />

              <QuoteCalc
                surfaceAreaM2={totals.surface}
                onRateChange={setRatePerM2}
              />

              {zones.length > 0 && totals.surface !== null && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Site observations, access notes, etc."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={saving || saved}
                  >
                    {saved
                      ? "Saved!"
                      : saving
                        ? "Saving..."
                        : "Save Estimate"}
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Right panel: map */}
        {/* Right panel: map */}
        <div className="relative flex-1 min-h-[50vh] lg:min-h-0">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            googleApiKey={undefined}
          >
            {geocoded && (
              <FlyToComponent
                center={[geocoded.lat, geocoded.lng]}
                zoom={BUILDING_ZOOM}
              />
            )}

            {/* Source footprint overlays */}
            {footprints?.microsoft && (
              <FootprintOverlay
                coordinates={footprints.microsoft.coordinates}
                source="Microsoft"
                areaM2={footprints.microsoft.areaM2}
                color="#ff6600"
                visible={showMicrosoft}
              />
            )}
            {footprints?.osm && (
              <FootprintOverlay
                coordinates={footprints.osm.coordinates}
                source="OSM"
                areaM2={footprints.osm.areaM2}
                color="#0066ff"
                visible={showOSM}
              />
            )}

            {/* Multi-zone polygon editor */}
            {geocoded && (
              <PolygonEditor
                key={editorKey}
                onZonesChange={handleZonesChange}
                color="#22c55e"
              />
            )}
          </MapView>
        </div>
      </main>
    </>
  );
}
