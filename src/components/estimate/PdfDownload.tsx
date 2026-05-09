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

/* ─── Mercator helpers ─────────────────────────────────────────── */
// Convert lat/lng to pixel position on a Google Static Map image
function latLngToPixel(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  imgW: number,
  imgH: number
): { x: number; y: number } {
  const scale = Math.pow(2, zoom) * 256;

  const lngToX = (ln: number) => ((ln + 180) / 360) * scale;
  const latToY = (lt: number) => {
    const sin = Math.sin((lt * Math.PI) / 180);
    return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  };

  const cx = lngToX(centerLng);
  const cy = latToY(centerLat);
  const px = lngToX(lng);
  const py = latToY(lat);

  return {
    x: px - cx + imgW / 2,
    y: py - cy + imgH / 2,
  };
}

/* ─── Draw polygon overlay on satellite canvas ─────────────────── */
function drawPolygonOverlay(
  ctx: CanvasRenderingContext2D,
  features: GeoJSONFeature[],
  centerLat: number,
  centerLng: number,
  zoom: number,
  imgW: number,
  imgH: number,
  surfaceAreaM2: number,
  pitchDegrees: number,
  ratePerM2: number | null,
  totalCost: number | null
) {
  const GREEN = "#7ccf3f";
  const GRID_SPACING = 24;

  // Draw each polygon with fill, grid, and outline
  for (const f of features) {
    if (f.geometry?.type !== "Polygon" || !f.geometry.coordinates?.[0]) continue;
    const coords = f.geometry.coordinates[0];
    const pixels = coords.map((c) =>
      latLngToPixel(c[1], c[0], centerLat, centerLng, zoom, imgW, imgH)
    );

    if (pixels.length < 3) continue;

    // Build path
    const buildPath = () => {
      ctx.beginPath();
      ctx.moveTo(pixels[0].x, pixels[0].y);
      for (let i = 1; i < pixels.length; i++) {
        ctx.lineTo(pixels[i].x, pixels[i].y);
      }
      ctx.closePath();
    };

    // 1) Semi-transparent green fill
    buildPath();
    ctx.fillStyle = "rgba(124, 207, 63, 0.30)";
    ctx.fill();

    // 2) Grid / net pattern (clip to polygon)
    ctx.save();
    buildPath();
    ctx.clip();

    ctx.strokeStyle = "rgba(124, 207, 63, 0.55)";
    ctx.lineWidth = 1;

    // Find bounding box of pixels
    const xs = pixels.map((p) => p.x);
    const ys = pixels.map((p) => p.y);
    const minX = Math.min(...xs) - 5;
    const maxX = Math.max(...xs) + 5;
    const minY = Math.min(...ys) - 5;
    const maxY = Math.max(...ys) + 5;

    // Vertical grid lines
    for (let x = Math.floor(minX / GRID_SPACING) * GRID_SPACING; x <= maxX; x += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
      ctx.stroke();
    }
    // Horizontal grid lines
    for (let y = Math.floor(minY / GRID_SPACING) * GRID_SPACING; y <= maxY; y += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
    }

    ctx.restore();

    // 3) Bold polygon outline
    buildPath();
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  // ── Callout card ────────────────────────────────────────
  // Find the centroid of all polygons for the arrow origin
  const allPixels: { x: number; y: number }[] = [];
  for (const f of features) {
    if (f.geometry?.type !== "Polygon" || !f.geometry.coordinates?.[0]) continue;
    for (const c of f.geometry.coordinates[0]) {
      allPixels.push(
        latLngToPixel(c[1], c[0], centerLat, centerLng, zoom, imgW, imgH)
      );
    }
  }

  if (allPixels.length === 0) return;

  const centroidX =
    allPixels.reduce((s, p) => s + p.x, 0) / allPixels.length;
  const centroidY =
    allPixels.reduce((s, p) => s + p.y, 0) / allPixels.length;

  // Card position — bottom-right area
  const cardW = 340;
  const cardH = ratePerM2 && totalCost ? 175 : 120;
  const cardX = imgW - cardW - 30;
  const cardY = imgH - cardH - 30;

  // ── Arrow from card to centroid ──
  const arrowStartX = cardX + 40;
  const arrowStartY = cardY;

  ctx.save();
  ctx.strokeStyle = GREEN;
  ctx.fillStyle = GREEN;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  // Curved arrow
  const cpX = (arrowStartX + centroidX) / 2 - 40;
  const cpY = (arrowStartY + centroidY) / 2 - 60;

  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowStartY);
  ctx.quadraticCurveTo(cpX, cpY, centroidX, centroidY + 15);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(
    centroidY + 15 - cpY,
    centroidX - cpX
  );
  const headLen = 14;
  ctx.beginPath();
  ctx.moveTo(centroidX, centroidY + 15);
  ctx.lineTo(
    centroidX - headLen * Math.cos(angle - 0.4),
    centroidY + 15 - headLen * Math.sin(angle - 0.4)
  );
  ctx.lineTo(
    centroidX - headLen * Math.cos(angle + 0.4),
    centroidY + 15 - headLen * Math.sin(angle + 0.4)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Card background ──
  const radius = 14;
  ctx.save();

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.moveTo(cardX + radius, cardY);
  ctx.lineTo(cardX + cardW - radius, cardY);
  ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + radius, radius);
  ctx.lineTo(cardX + cardW, cardY + cardH - radius);
  ctx.arcTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH, radius);
  ctx.lineTo(cardX + radius, cardY + cardH);
  ctx.arcTo(cardX, cardY + cardH, cardX, cardY + cardH - radius, radius);
  ctx.lineTo(cardX, cardY + radius);
  ctx.arcTo(cardX, cardY, cardX + radius, cardY, radius);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // ── Card content ──
  let ty = cardY + 30;
  const leftCol = cardX + 24;
  const rightCol = cardX + cardW - 24;

  // Row 1: Roof size
  ctx.fillStyle = "#374151";
  ctx.font = "600 16px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Roof size:", leftCol, ty);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 22px Helvetica, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${surfaceAreaM2.toFixed(1)} m²`, rightCol, ty);

  // Divider
  ty += 18;
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftCol, ty);
  ctx.lineTo(rightCol, ty);
  ctx.stroke();

  // Row 2: Pitch
  ty += 26;
  ctx.fillStyle = "#374151";
  ctx.font = "600 16px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Roof pitch:", leftCol, ty);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 22px Helvetica, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${pitchDegrees}°`, rightCol, ty);

  // Cost section
  if (ratePerM2 && totalCost) {
    // Divider
    ty += 18;
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftCol, ty);
    ctx.lineTo(rightCol, ty);
    ctx.stroke();

    // Gray background strip
    ty += 4;
    ctx.fillStyle = "#f3f4f6";
    const stripH = 44;
    // Rounded bottom corners
    ctx.beginPath();
    ctx.moveTo(cardX, ty);
    ctx.lineTo(cardX + cardW, ty);
    ctx.lineTo(cardX + cardW, ty + stripH - radius);
    ctx.arcTo(cardX + cardW, ty + stripH, cardX + cardW - radius, ty + stripH, radius);
    ctx.lineTo(cardX + radius, ty + stripH);
    ctx.arcTo(cardX, ty + stripH, cardX, ty + stripH - radius, radius);
    ctx.closePath();
    ctx.fill();

    ty += 18;
    ctx.fillStyle = "#6b7280";
    ctx.font = "500 13px Helvetica, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Estimated cost:", leftCol, ty);

    ty += 24;
    ctx.fillStyle = "#111827";
    ctx.font = "bold 24px Helvetica, Arial, sans-serif";
    ctx.textAlign = "left";
    const formatted = `R ${totalCost.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    ctx.fillText(formatted, leftCol, ty);
  }
}

/* ─── Build the composite satellite + overlay image ────────────── */
async function buildRoofImage(
  lat: number,
  lng: number,
  footprintGeoJSON: string,
  surfaceAreaM2: number,
  pitchDegrees: number,
  ratePerM2: number | null,
  totalCost: number | null
): Promise<string | null> {
  // 1. Parse GeoJSON
  let features: GeoJSONFeature[] = [];
  try {
    const geo = JSON.parse(footprintGeoJSON);
    if (geo.type === "FeatureCollection") {
      features = geo.features;
    } else if (geo.type === "Polygon") {
      features = [{ geometry: geo }];
    }
  } catch {
    return null;
  }
  if (features.length === 0) return null;

  const ZOOM = 20;
  const IMG_W = 1280; // 640 * scale 2
  const IMG_H = 960; // 480 * scale 2

  // 2. Try to fetch satellite image
  let satelliteImg: HTMLImageElement | null = null;
  try {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    const res = await fetch(`/api/static-map?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      satelliteImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });
    }
  } catch {
    // Fall through to dark background
  }

  // 3. Canvas compositing
  const canvas = document.createElement("canvas");
  canvas.width = IMG_W;
  canvas.height = IMG_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background: satellite image or dark fallback
  if (satelliteImg) {
    ctx.drawImage(satelliteImg, 0, 0, IMG_W, IMG_H);
    URL.revokeObjectURL(satelliteImg.src);
  } else {
    // Dark aerial-style fallback
    ctx.fillStyle = "#1a2e1a";
    ctx.fillRect(0, 0, IMG_W, IMG_H);
  }

  // 4. Draw overlay
  drawPolygonOverlay(
    ctx,
    features,
    lat,
    lng,
    ZOOM,
    IMG_W,
    IMG_H,
    surfaceAreaM2,
    pitchDegrees,
    ratePerM2,
    totalCost
  );

  return canvas.toDataURL("image/png", 0.92);
}

/* ─── Component ────────────────────────────────────────────────── */
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

      // Build composite roof image (satellite + polygon overlay + callout)
      const polygonImageUrl = await buildRoofImage(
        estimate.latitude,
        estimate.longitude,
        estimate.footprintGeoJSON,
        estimate.surfaceAreaM2,
        estimate.pitchDegrees,
        estimate.ratePerM2,
        estimate.totalCost
      );

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
