"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PITCH_PRESETS, pitchMultiplier, calculateSurfaceArea } from "@/lib/calc/pitch";

export interface ZonePitch {
  zoneId: string;
  pitchDegrees: number;
}

interface ZoneListProps {
  zones: { id: string; areaM2: number }[];
  zonePitches: ZonePitch[];
  onPitchChange: (zoneId: string, pitchDegrees: number) => void;
  onApplyPitchToAll: (pitchDegrees: number) => void;
}

export default function ZoneList({
  zones,
  zonePitches,
  onPitchChange,
  onApplyPitchToAll,
}: ZoneListProps) {
  if (zones.length === 0) return null;

  const totalFootprint = zones.reduce((sum, z) => sum + z.areaM2, 0);
  const totalSurface = zones.reduce((sum, z) => {
    const pitch = zonePitches.find((p) => p.zoneId === z.id)?.pitchDegrees ?? 22.5;
    return sum + calculateSurfaceArea(z.areaM2, pitch);
  }, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Roof Zones ({zones.length})</span>
          {zones.length > 1 && (
            <span className="text-xs font-normal text-muted-foreground">
              Each zone can have its own pitch
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick apply buttons */}
        {zones.length > 1 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Apply pitch to all zones:</p>
            <div className="flex flex-wrap gap-1">
              {PITCH_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => onApplyPitchToAll(preset.degrees)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {zones.map((zone, idx) => {
          const pitch =
            zonePitches.find((p) => p.zoneId === zone.id)?.pitchDegrees ?? 22.5;
          const surfaceArea = calculateSurfaceArea(zone.areaM2, pitch);

          return (
            <div
              key={zone.id}
              className="rounded-md border p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Zone {idx + 1}</span>
                <span className="text-xs text-muted-foreground">
                  {zone.areaM2.toFixed(1)} m² footprint
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">
                  Pitch:
                </label>
                <div className="flex flex-wrap gap-1">
                  {PITCH_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`rounded px-2 py-0.5 text-xs border transition-colors ${
                        pitch === preset.degrees
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-accent"
                      }`}
                      onClick={() => onPitchChange(zone.id, preset.degrees)}
                      title={preset.description}
                    >
                      {preset.degrees}&deg;
                    </button>
                  ))}
                  <Input
                    type="number"
                    min={0}
                    max={70}
                    step={0.5}
                    value={pitch}
                    onChange={(e) =>
                      onPitchChange(zone.id, parseFloat(e.target.value) || 0)
                    }
                    className="h-6 w-16 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  x{pitchMultiplier(pitch).toFixed(3)}
                </span>
                <span className="font-medium text-foreground">
                  {surfaceArea.toFixed(1)} m² surface
                </span>
              </div>
            </div>
          );
        })}

        {/* Totals */}
        <div className="rounded-md bg-muted p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Total Footprint:</span>
            <span className="font-medium">{totalFootprint.toFixed(1)} m²</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Total Surface Area:</span>
            <span>{totalSurface.toFixed(1)} m²</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
