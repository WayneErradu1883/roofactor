"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AreaResultProps {
  totalFootprintM2: number | null;
  totalSurfaceM2: number | null;
  zoneCount: number;
  confidence: "high" | "medium" | "low" | null;
  discrepancy: number | null;
  sourcesUsed: string[];
}

const confidenceColors = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-red-100 text-red-800 border-red-200",
};

const confidenceLabels = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Low Confidence",
};

export default function AreaResult({
  totalFootprintM2,
  totalSurfaceM2,
  zoneCount,
  confidence,
  discrepancy,
  sourcesUsed,
}: AreaResultProps) {
  if (totalFootprintM2 === null) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Draw or select a roof outline to see area calculations.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Measurement Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Footprint (2D)</p>
            <p className="text-2xl font-bold">{totalFootprintM2.toFixed(1)} m²</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Total Surface Area
            </p>
            <p className="text-2xl font-bold">
              {totalSurfaceM2 !== null ? totalSurfaceM2.toFixed(1) : "—"} m²
            </p>
          </div>
        </div>

        {zoneCount > 1 && (
          <p className="text-xs text-muted-foreground">
            Calculated across {zoneCount} roof zones with individual pitch angles.
          </p>
        )}

        {confidence && (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${confidenceColors[confidence]}`}
          >
            <span className="font-medium">{confidenceLabels[confidence]}</span>
            {discrepancy !== null && (
              <span className="ml-2">
                — sources differ by {discrepancy.toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {sourcesUsed.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Data sources: {sourcesUsed.join(", ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
