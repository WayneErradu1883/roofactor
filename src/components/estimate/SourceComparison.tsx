"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SourceData {
  coordinates: [number, number][];
  areaM2: number;
  source: string;
}

interface SourceComparisonProps {
  microsoft: SourceData | null;
  osm: SourceData | null;
  confidence: "high" | "medium" | "low";
  discrepancy: number | null;
  showMicrosoft: boolean;
  showOSM: boolean;
  onToggleMicrosoft: (show: boolean) => void;
  onToggleOSM: (show: boolean) => void;
  onSelectSource: (source: "microsoft" | "osm") => void;
}

const confidenceBadge = {
  high: { bg: "bg-green-500", text: "Sources Agree" },
  medium: { bg: "bg-amber-500", text: "Minor Differences" },
  low: { bg: "bg-red-500", text: "Significant Differences" },
};

export default function SourceComparison({
  microsoft,
  osm,
  confidence,
  discrepancy,
  showMicrosoft,
  showOSM,
  onToggleMicrosoft,
  onToggleOSM,
  onSelectSource,
}: SourceComparisonProps) {
  const hasBothSources = microsoft && osm;
  const badge = confidenceBadge[confidence];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Source Comparison</CardTitle>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${badge.bg}`}
            />
            <span className="text-xs text-muted-foreground">{badge.text}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Source cards side by side */}
        <div className="grid grid-cols-1 gap-2">
          {microsoft && (
            <div
              className={`rounded-md border p-3 transition-colors ${
                showMicrosoft
                  ? "border-orange-300 bg-orange-50"
                  : "border-muted opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showMicrosoft}
                    onChange={(e) => onToggleMicrosoft(e.target.checked)}
                  />
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: "#ff6600" }}
                  />
                  <span className="text-sm font-medium">Microsoft ML</span>
                </div>
                <span className="text-sm font-bold">
                  {microsoft.areaM2.toFixed(1)} m²
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  AI-detected building footprint
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onSelectSource("microsoft")}
                >
                  Use as base
                </Button>
              </div>
            </div>
          )}

          {osm && (
            <div
              className={`rounded-md border p-3 transition-colors ${
                showOSM
                  ? "border-blue-300 bg-blue-50"
                  : "border-muted opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showOSM}
                    onChange={(e) => onToggleOSM(e.target.checked)}
                  />
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: "#0066ff" }}
                  />
                  <span className="text-sm font-medium">OpenStreetMap</span>
                </div>
                <span className="text-sm font-bold">
                  {osm.areaM2.toFixed(1)} m²
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Community-mapped outline
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onSelectSource("osm")}
                >
                  Use as base
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Discrepancy bar */}
        {hasBothSources && discrepancy !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Area difference</span>
              <span
                className={
                  discrepancy <= 2
                    ? "text-green-600"
                    : discrepancy <= 5
                      ? "text-amber-600"
                      : "text-red-600"
                }
              >
                {discrepancy.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${
                  discrepancy <= 2
                    ? "bg-green-500"
                    : discrepancy <= 5
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.min(discrepancy * 10, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-medium">2% tolerance</span>
              <span>10%+</span>
            </div>
          </div>
        )}

        {!microsoft && !osm && (
          <p className="text-sm text-muted-foreground">
            No building footprints found at this location. Draw the roof outline
            manually using the polygon tool on the map.
          </p>
        )}

        {(microsoft || osm) && !(microsoft && osm) && (
          <p className="text-xs text-amber-600">
            Only one source available. Cross-verification not possible — verify
            visually against satellite imagery.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
