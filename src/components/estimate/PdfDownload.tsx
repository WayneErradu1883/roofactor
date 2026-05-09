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
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

function generateQuoteNumber(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const xxx = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `NP-QUOTE-${dd}${mm}-${xxx}`;
}

/**
 * Fetch a satellite image with polygon overlay from our API route
 * (uses server-side Google Maps API key), then convert to data URL.
 */
async function fetchSatelliteMapImage(
  lat: number,
  lng: number,
  footprintGeoJSON: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      geojson: footprintGeoJSON,
    });
    const res = await fetch(`/api/static-map?${params}`);
    if (!res.ok) return null;

    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Fallback: render a simple SVG polygon diagram (no satellite imagery).
 */
function generateFallbackSvg(
  geoJSON: { type: string; features: GeoJSONFeature[] },
  zones: { zone: number }[]
): string | null {
  if (
    !geoJSON ||
    geoJSON.type !== "FeatureCollection" ||
    !geoJSON.features?.length
  )
    return null;

  const width = 400;
  const height = 300;
  const padding = 30;

  const allCoords: number[][] = [];
  for (const f of geoJSON.features) {
    if (f.geometry?.type === "Polygon" && f.geometry.coordinates?.[0]) {
      allCoords.push(...f.geometry.coordinates[0]);
    }
  }
  if (allCoords.length === 0) return null;

  const lngs = allCoords.map((c) => c[0]);
  const lats = allCoords.map((c) => c[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const rangeX = maxLng - minLng || 0.0001;
  const rangeY = maxLat - minLat || 0.0001;
  const scaleX = (width - 2 * padding) / rangeX;
  const scaleY = (height - 2 * padding) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  const usedW = rangeX * scale;
  const usedH = rangeY * scale;
  const offsetX = padding + (width - 2 * padding - usedW) / 2;
  const offsetY = padding + (height - 2 * padding - usedH) / 2;

  function toPixel(coord: number[]): { x: number; y: number } {
    return {
      x: offsetX + (coord[0] - minLng) * scale,
      y: offsetY + (maxLat - coord[1]) * scale,
    };
  }

  let polygonsSvg = "";
  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  geoJSON.features.forEach((f, idx) => {
    if (f.geometry?.type !== "Polygon" || !f.geometry.coordinates?.[0]) return;
    const coords = f.geometry.coordinates[0];
    const points = coords
      .map((c) => {
        const p = toPixel(c);
        return `${p.x},${p.y}`;
      })
      .join(" ");

    const color = colors[idx % colors.length];
    polygonsSvg += `<polygon points="${points}" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;

    const cx = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const cy = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    const cp = toPixel([cx, cy]);
    const zoneNum = zones[idx]?.zone ?? idx + 1;
    polygonsSvg += `<text x="${cp.x}" y="${cp.y}" text-anchor="middle" dominant-baseline="central" font-family="Helvetica,Arial,sans-serif" font-size="14" font-weight="bold" fill="${color}">Zone ${zoneNum}</text>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f8fafc" rx="8"/>
  ${polygonsSvg}
</svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

async function svgToPngDataUrl(svgDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(svgDataUrl);
        return;
      }
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("SVG to PNG conversion failed"));
    img.src = svgDataUrl;
  });
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

      let parsedGeoJSON: { type: string; features: GeoJSONFeature[] } | null =
        null;

      try {
        const geoJSON = JSON.parse(estimate.footprintGeoJSON);
        if (geoJSON.type === "FeatureCollection") {
          parsedGeoJSON = geoJSON;
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

      // Generate polygon image — try satellite map first, fall back to SVG
      let polygonImageUrl: string | null = null;
      polygonImageUrl = await fetchSatelliteMapImage(
        estimate.latitude,
        estimate.longitude,
        estimate.footprintGeoJSON
      );

      // Fallback to simple SVG diagram if satellite map isn't available
      if (!polygonImageUrl && parsedGeoJSON) {
        const svgUrl = generateFallbackSvg(parsedGeoJSON, zones);
        if (svgUrl) {
          try {
            polygonImageUrl = await svgToPngDataUrl(svgUrl);
          } catch {
            polygonImageUrl = svgUrl;
          }
        }
      }

      // Generate quote number
      const quoteNumber = generateQuoteNumber();

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
          notes={estimate.notes}
          zones={zones}
          createdAt={estimate.createdAt}
          estimatorName={estimatorName}
          quoteNumber={quoteNumber}
          polygonImageUrl={polygonImageUrl ?? undefined}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const shortAddr = estimate.address
        .split(",")[0]
        .trim()
        .replace(/\s+/g, "-");
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
