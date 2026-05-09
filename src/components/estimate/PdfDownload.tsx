"use client";

import { useState, useCallback, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QuoteDocument, { type PdfBranding } from "@/lib/pdf/QuoteDocument";
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
  return { x: px - cx + imgW / 2, y: py - cy + imgH / 2 };
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

  for (const f of features) {
    if (f.geometry?.type !== "Polygon" || !f.geometry.coordinates?.[0]) continue;
    const coords = f.geometry.coordinates[0];
    const pixels = coords.map((c) =>
      latLngToPixel(c[1], c[0], centerLat, centerLng, zoom, imgW, imgH)
    );
    if (pixels.length < 3) continue;

    const buildPath = () => {
      ctx.beginPath();
      ctx.moveTo(pixels[0].x, pixels[0].y);
      for (let i = 1; i < pixels.length; i++) ctx.lineTo(pixels[i].x, pixels[i].y);
      ctx.closePath();
    };

    buildPath();
    ctx.fillStyle = "rgba(124, 207, 63, 0.30)";
    ctx.fill();

    ctx.save();
    buildPath();
    ctx.clip();
    ctx.strokeStyle = "rgba(124, 207, 63, 0.55)";
    ctx.lineWidth = 1;
    const xs = pixels.map((p) => p.x);
    const ys = pixels.map((p) => p.y);
    const minX = Math.min(...xs) - 5;
    const maxX = Math.max(...xs) + 5;
    const minY = Math.min(...ys) - 5;
    const maxY = Math.max(...ys) + 5;
    for (let x = Math.floor(minX / GRID_SPACING) * GRID_SPACING; x <= maxX; x += GRID_SPACING) {
      ctx.beginPath(); ctx.moveTo(x, minY); ctx.lineTo(x, maxY); ctx.stroke();
    }
    for (let y = Math.floor(minY / GRID_SPACING) * GRID_SPACING; y <= maxY; y += GRID_SPACING) {
      ctx.beginPath(); ctx.moveTo(minX, y); ctx.lineTo(maxX, y); ctx.stroke();
    }
    ctx.restore();

    buildPath();
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  // Callout
  const allPixels: { x: number; y: number }[] = [];
  for (const f of features) {
    if (f.geometry?.type !== "Polygon" || !f.geometry.coordinates?.[0]) continue;
    for (const c of f.geometry.coordinates[0]) {
      allPixels.push(latLngToPixel(c[1], c[0], centerLat, centerLng, zoom, imgW, imgH));
    }
  }
  if (allPixels.length === 0) return;

  const centroidX = allPixels.reduce((s, p) => s + p.x, 0) / allPixels.length;
  const centroidY = allPixels.reduce((s, p) => s + p.y, 0) / allPixels.length;

  const cardW = 340;
  const cardH = ratePerM2 && totalCost ? 175 : 120;
  const cardX = imgW - cardW - 30;
  const cardY = imgH - cardH - 30;
  const radius = 14;

  // Arrow
  const arrowStartX = cardX + 40;
  const arrowStartY = cardY;
  ctx.save();
  ctx.strokeStyle = GREEN;
  ctx.fillStyle = GREEN;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  const cpX = (arrowStartX + centroidX) / 2 - 40;
  const cpY = (arrowStartY + centroidY) / 2 - 60;
  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowStartY);
  ctx.quadraticCurveTo(cpX, cpY, centroidX, centroidY + 15);
  ctx.stroke();
  const angle = Math.atan2(centroidY + 15 - cpY, centroidX - cpX);
  const headLen = 14;
  ctx.beginPath();
  ctx.moveTo(centroidX, centroidY + 15);
  ctx.lineTo(centroidX - headLen * Math.cos(angle - 0.4), centroidY + 15 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(centroidX - headLen * Math.cos(angle + 0.4), centroidY + 15 - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Card background
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 16;
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

  // Card content
  let ty = cardY + 30;
  const leftCol = cardX + 24;
  const rightCol = cardX + cardW - 24;

  ctx.fillStyle = "#374151";
  ctx.font = "600 16px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Roof size:", leftCol, ty);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 22px Helvetica, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${surfaceAreaM2.toFixed(1)} m²`, rightCol, ty);

  ty += 18;
  ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(leftCol, ty); ctx.lineTo(rightCol, ty); ctx.stroke();

  ty += 26;
  ctx.fillStyle = "#374151";
  ctx.font = "600 16px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Roof pitch:", leftCol, ty);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 22px Helvetica, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${pitchDegrees}°`, rightCol, ty);

  if (ratePerM2 && totalCost) {
    ty += 18;
    ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(leftCol, ty); ctx.lineTo(rightCol, ty); ctx.stroke();

    ty += 4;
    ctx.fillStyle = "#f3f4f6";
    const stripH = 44;
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
    ctx.fillText(
      `R ${totalCost.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      leftCol,
      ty
    );
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
  let features: GeoJSONFeature[] = [];
  try {
    const geo = JSON.parse(footprintGeoJSON);
    if (geo.type === "FeatureCollection") features = geo.features;
    else if (geo.type === "Polygon") features = [{ geometry: geo }];
  } catch {
    return null;
  }
  if (features.length === 0) return null;

  const ZOOM = 20;
  const IMG_W = 1280;
  const IMG_H = 960;

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
    // fall through
  }

  const canvas = document.createElement("canvas");
  canvas.width = IMG_W;
  canvas.height = IMG_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (satelliteImg) {
    ctx.drawImage(satelliteImg, 0, 0, IMG_W, IMG_H);
    URL.revokeObjectURL(satelliteImg.src);
  } else {
    ctx.fillStyle = "#1a2e1a";
    ctx.fillRect(0, 0, IMG_W, IMG_H);
  }

  drawPolygonOverlay(ctx, features, lat, lng, ZOOM, IMG_W, IMG_H, surfaceAreaM2, pitchDegrees, ratePerM2, totalCost);
  return canvas.toDataURL("image/png", 0.92);
}

/* ─── Shared: build the PDF blob ───────────────────────────────── */
interface PdfResult {
  blob: Blob;
  quoteNumber: string;
}

async function buildPdfBlob(
  estimate: PdfDownloadProps["estimate"],
  estimatorName: string
): Promise<PdfResult> {
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
      zones = [{
        zone: 1,
        pitchDegrees: estimate.pitchDegrees,
        footprintAreaM2: estimate.footprintAreaM2,
        surfaceAreaM2: estimate.surfaceAreaM2,
      }];
    }
  } catch {
    zones = [{
      zone: 1,
      pitchDegrees: estimate.pitchDegrees,
      footprintAreaM2: estimate.footprintAreaM2,
      surfaceAreaM2: estimate.surfaceAreaM2,
    }];
  }

  const polygonImageUrl = await buildRoofImage(
    estimate.latitude,
    estimate.longitude,
    estimate.footprintGeoJSON,
    estimate.surfaceAreaM2,
    estimate.pitchDegrees,
    estimate.ratePerM2,
    estimate.totalCost
  );

  const quoteNumber = generateQuoteNumber();

  // Fetch PDF branding settings
  let branding: PdfBranding | undefined;
  try {
    const settingsRes = await fetch("/api/settings/pdf");
    if (settingsRes.ok) {
      const { settings } = await settingsRes.json();
      branding = {
        companyName: settings.companyName,
        companyTagline: settings.companyTagline,
        companyLogo: settings.companyLogo,
        documentTitle: settings.documentTitle,
        termsAndConditions: settings.termsAndConditions,
        footerText: settings.footerText,
        quoteValidityDays: settings.quoteValidityDays,
        contactPhone: settings.contactPhone,
        contactEmail: settings.contactEmail,
      };
    }
  } catch {
    // use defaults
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
      notes={estimate.notes}
      zones={zones}
      createdAt={estimate.createdAt}
      estimatorName={estimatorName}
      quoteNumber={quoteNumber}
      polygonImageUrl={polygonImageUrl ?? undefined}
      branding={branding}
    />
  ).toBlob();

  return { blob, quoteNumber };
}

/* ─── Component ────────────────────────────────────────────────── */
export default function PdfDownload({
  estimate,
  estimatorName,
}: PdfDownloadProps) {
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sendingWA, setSendingWA] = useState(false);

  // Keep a cached blob + quote number so View/WhatsApp can reuse it
  const cachedPdf = useRef<PdfResult | null>(null);

  const generatePdf = useCallback(async () => {
    if (cachedPdf.current) return cachedPdf.current;
    const result = await buildPdfBlob(estimate, estimatorName);
    cachedPdf.current = result;
    return result;
  }, [estimate, estimatorName]);

  // ── Download PDF ──
  async function handleDownload() {
    setGenerating(true);
    try {
      const { blob, quoteNumber } = await generatePdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quoteNumber}.pdf`;
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

  // ── View PDF (preview in new tab) ──
  async function handlePreview() {
    setPreviewing(true);
    try {
      const { blob } = await generatePdf();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Don't revoke immediately — browser needs time to load
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error("PDF preview failed:", err);
    } finally {
      setPreviewing(false);
    }
  }

  // ── WhatsApp send ──
  async function handleWhatsApp() {
    if (!phoneNumber.trim()) return;
    setSendingWA(true);
    try {
      const { blob, quoteNumber } = await generatePdf();

      // Normalise phone: strip spaces/dashes, convert leading 0 to +27 (SA)
      let phone = phoneNumber.replace(/[\s\-()]/g, "");
      if (phone.startsWith("0")) {
        phone = "27" + phone.slice(1);
      } else if (!phone.startsWith("+") && !phone.startsWith("27")) {
        phone = "27" + phone;
      }
      phone = phone.replace(/^\+/, "");

      // Try Web Share API first (works on mobile / some desktop)
      const file = new File([blob], `${quoteNumber}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Quote ${quoteNumber}`,
          text: `Hi, please find your roof coating quotation ${quoteNumber} attached.`,
        });
      } else {
        // Fallback: open WhatsApp with a message, user can attach the downloaded PDF
        // First download the file so user has it
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${quoteNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Open WhatsApp with pre-filled message
        const message = encodeURIComponent(
          `Hi, please find your roof coating quotation *${quoteNumber}* for the property at ${estimate.address}. The PDF has been downloaded — please attach it to this chat.`
        );
        window.open(
          `https://web.whatsapp.com/send?phone=${phone}&text=${message}`,
          "_blank"
        );
      }
    } catch (err) {
      console.error("WhatsApp send failed:", err);
    } finally {
      setSendingWA(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Download PDF */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleDownload}
        disabled={generating || previewing || sendingWA}
      >
        {generating ? "Generating PDF..." : "Download PDF Quote"}
      </Button>

      {/* View PDF */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handlePreview}
        disabled={generating || previewing || sendingWA}
      >
        {previewing ? "Opening Preview..." : "View PDF"}
      </Button>

      {/* WhatsApp to Customer */}
      {!showWhatsApp ? (
        <Button
          variant="outline"
          className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => setShowWhatsApp(true)}
          disabled={generating || previewing || sendingWA}
        >
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp to Customer
        </Button>
      ) : (
        <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-3">
          <Label htmlFor="wa-phone" className="text-sm font-medium text-green-800">
            Customer WhatsApp Number
          </Label>
          <div className="flex gap-2">
            <Input
              id="wa-phone"
              type="tel"
              placeholder="e.g. 082 123 4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 border-green-300 focus-visible:ring-green-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleWhatsApp();
              }}
            />
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white px-4"
              onClick={handleWhatsApp}
              disabled={!phoneNumber.trim() || sendingWA}
            >
              {sendingWA ? "Sending..." : "Send"}
            </Button>
          </div>
          <p className="text-xs text-green-600">
            SA numbers auto-convert (082... becomes +27 82...).
            The PDF will be downloaded and WhatsApp Web will open with a pre-filled message.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-green-700 hover:text-green-800"
            onClick={() => setShowWhatsApp(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
