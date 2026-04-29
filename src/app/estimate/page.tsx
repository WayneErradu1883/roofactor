"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { NavHeader } from "@/components/NavHeader";
import AddressSearch, {
  type GeocodedAddress,
} from "@/components/estimate/AddressSearch";
import PitchSelector from "@/components/estimate/PitchSelector";
import AreaResult from "@/components/estimate/AreaResult";
import QuoteCalc from "@/components/estimate/QuoteCalc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateSurfaceArea } from "@/lib/calc/pitch";
import type { PolygonData } from "@/components/map/PolygonEditor";
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

interface FootprintResponse {
  microsoft: FootprintSource | null;
  osm: FootprintSource | null;
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
  const [polygon, setPolygon] = useState<PolygonData | null>(null);
  const [pitchDegrees, setPitchDegrees] = useState(22.5);
  const [ratePerM2, setRatePerM2] = useState(150);
  const [showMicrosoft, setShowMicrosoft] = useState(true);
  const [showOSM, setShowOSM] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const surfaceAreaM2 = useMemo(() => {
    if (!polygon) return null;
    return calculateSurfaceArea(polygon.areaM2, pitchDegrees);
  }, [polygon, pitchDegrees]);

  const handleAddressFound = useCallback(async (result: GeocodedAddress) => {
    setGeocoded(result);
    setMapCenter([result.lat, result.lng]);
    setMapZoom(BUILDING_ZOOM);
    setPolygon(null);
    setSaved(false);

    // Fetch building footprints
    setFootprintLoading(true);
    try {
      const res = await fetch(
        `/api/footprint?lat=${result.lat}&lng=${result.lng}`
      );
      if (res.ok) {
        const data = await res.json();
        setFootprints(data);
      }
    } catch {
      // Footprints are optional — user can still draw manually
    } finally {
      setFootprintLoading(false);
    }
  }, []);

  const handlePolygonChange = useCallback((data: PolygonData | null) => {
    setPolygon(data);
    setSaved(false);
  }, []);

  // Determine which initial polygon to load into the editor
  const bestFootprint = useMemo(() => {
    if (!footprints) return undefined;
    // Prefer Microsoft (usually more accurate), fall back to OSM
    const source = footprints.microsoft || footprints.osm;
    return source?.coordinates;
  }, [footprints]);

  async function handleSave() {
    if (!geocoded || !polygon || surfaceAreaM2 === null) return;

    setSaving(true);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: geocoded.formatted_address,
          latitude: geocoded.lat,
          longitude: geocoded.lng,
          footprintGeoJSON: JSON.stringify({
            type: "Polygon",
            coordinates: [
              polygon.latlngs.map((ll) => [ll[1], ll[0]]),
            ],
          }),
          footprintAreaM2: polygon.areaM2,
          pitchDegrees,
          surfaceAreaM2,
          ratePerM2,
          totalCost: surfaceAreaM2 * ratePerM2,
          confidenceScore:
            footprints?.confidence === "high"
              ? 0.95
              : footprints?.confidence === "medium"
                ? 0.75
                : 0.5,
          sourcesUsed: JSON.stringify(footprints?.sourcesAvailable || []),
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

  return (
    <>
      <NavHeader />
      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Left panel: controls */}
        <div className="w-full space-y-4 overflow-y-auto border-r p-4 lg:w-96">
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

          {footprints && !footprintLoading && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {footprints.microsoft && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showMicrosoft}
                      onChange={(e) => setShowMicrosoft(e.target.checked)}
                    />
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ backgroundColor: "#ff6600" }}
                    />
                    Microsoft: {footprints.microsoft.areaM2.toFixed(1)} m²
                  </label>
                )}
                {footprints.osm && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showOSM}
                      onChange={(e) => setShowOSM(e.target.checked)}
                    />
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ backgroundColor: "#0066ff" }}
                    />
                    OSM: {footprints.osm.areaM2.toFixed(1)} m²
                  </label>
                )}
                {!footprints.microsoft && !footprints.osm && (
                  <p className="text-muted-foreground">
                    No building footprints found. Draw the roof outline manually
                    using the polygon tool on the map.
                  </p>
                )}
                {footprints.discrepancy !== null && (
                  <p className="text-xs text-muted-foreground">
                    Source discrepancy: {footprints.discrepancy.toFixed(1)}%
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {geocoded && (
            <>
              <PitchSelector value={pitchDegrees} onChange={setPitchDegrees} />

              <AreaResult
                footprintAreaM2={polygon?.areaM2 ?? null}
                surfaceAreaM2={surfaceAreaM2}
                pitchDegrees={pitchDegrees}
                confidence={footprints?.confidence ?? null}
                discrepancy={footprints?.discrepancy ?? null}
                sourcesUsed={footprints?.sourcesAvailable ?? []}
              />

              <QuoteCalc
                surfaceAreaM2={surfaceAreaM2}
                onRateChange={setRatePerM2}
              />

              {polygon && surfaceAreaM2 !== null && (
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
              )}
            </>
          )}
        </div>

        {/* Right panel: map */}
        <div className="relative flex-1" style={{ minHeight: "500px" }}>
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            googleApiKey={undefined} // Will use keyless Google tiles
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

            {/* Editable polygon */}
            {geocoded && (
              <PolygonEditor
                onPolygonChange={handlePolygonChange}
                initialPolygon={bestFootprint}
                sourceLabel={
                  footprints?.microsoft
                    ? "Microsoft"
                    : footprints?.osm
                      ? "OSM"
                      : undefined
                }
                color="#22c55e"
              />
            )}
          </MapView>
        </div>
      </main>
    </>
  );
}
