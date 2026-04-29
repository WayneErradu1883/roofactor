"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import QuoteDocument from "@/lib/pdf/QuoteDocument";
import { calculateSurfaceArea } from "@/lib/calc/pitch";

interface PdfDownloadProps {
  estimate: {
    address: string;
    latitude: number;
    longitude: number;
    footprintGeoJSON: string;
    footprintAreaM2: number;
    surfaceAreaM2: number;
    pitchDegrees: number;
    ratePerM2: number | null;
    totalCost: number | null;
    confidenceScore: number | null;
    sourcesUsed: string;
    notes: string | null;
    createdAt: string;
  };
  estimatorName: string;
}

interface GeoJSONFeature {
  properties?: {
    zone?: number;
    pitchDegrees?: number;
    footprintAreaM2?: number;
  };
}

export default function PdfDownload({
  estimate,
  estimatorName,
}: PdfDownloadProps) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      // Parse zones from GeoJSON
      let zones: {
        zone: number;
        pitchDegrees: number;
        footprintAreaM2: number;
        surfaceAreaM2: number;
      }[] = [];

      try {
        const geoJSON = JSON.parse(estimate.footprintGeoJSON);
        if (geoJSON.type === "FeatureCollection") {
          zones = geoJSON.features.map((f: GeoJSONFeature, idx: number) => {
            const pitch = f.properties?.pitchDegrees ?? estimate.pitchDegrees;
            const area = f.properties?.footprintAreaM2 ?? 0;
            return {
              zone: f.properties?.zone ?? idx + 1,
              pitchDegrees: pitch,
              footprintAreaM2: area,
              surfaceAreaM2: calculateSurfaceArea(area, pitch),
            };
          });
        } else {
          zones = [
            {
              zone: 1,
              pitchDegrees: estimate.pitchDegrees,
              footprintAreaM2: estimate.footprintAreaM2,
              surfaceAreaM2: estimate.surfaceAreaM2,
            },
          ];
        }
      } catch {
        zones = [
          {
            zone: 1,
            pitchDegrees: estimate.pitchDegrees,
            footprintAreaM2: estimate.footprintAreaM2,
            surfaceAreaM2: estimate.surfaceAreaM2,
          },
        ];
      }

      let sourcesUsed: string[] = [];
      try {
        sourcesUsed = JSON.parse(estimate.sourcesUsed);
      } catch {
        // ignore
      }

      const blob = await pdf(
        <QuoteDocument
          address={estimate.address}
          latitude={estimate.latitude}
          longitude={estimate.longitude}
          footprintAreaM2={estimate.footprintAreaM2}
          surfaceAreaM2={estimate.surfaceAreaM2}
          pitchDegrees={estimate.pitchDegrees}
          ratePerM2={estimate.ratePerM2}
          totalCost={estimate.totalCost}
          confidenceScore={estimate.confidenceScore}
          sourcesUsed={sourcesUsed}
          notes={estimate.notes}
          zones={zones}
          createdAt={estimate.createdAt}
          estimatorName={estimatorName}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const shortAddr = estimate.address.split(",")[0].trim().replace(/\s+/g, "-");
      a.download = `Roofactor-Quote-${shortAddr}-${new Date(estimate.createdAt).toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleDownload}
      disabled={generating}
    >
      {generating ? "Generating PDF..." : "Download PDF Quote"}
    </Button>
  );
}
