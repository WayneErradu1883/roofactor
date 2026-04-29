import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchMicrosoftFootprints } from "@/lib/sources/microsoft";
import { fetchOSMFootprints } from "@/lib/sources/osm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Valid lat and lng parameters are required" },
      { status: 400 }
    );
  }

  // Fetch from both sources in parallel
  const [msFootprints, osmFootprints] = await Promise.all([
    fetchMicrosoftFootprints(lat, lng).catch(() => []),
    fetchOSMFootprints(lat, lng).catch(() => []),
  ]);

  // Pick the closest building from each source
  const microsoft = msFootprints.length > 0 ? msFootprints[0] : null;
  const osm = osmFootprints.length > 0 ? osmFootprints[0] : null;

  // Calculate confidence based on source agreement
  let confidence: "high" | "medium" | "low" = "low";
  let discrepancy: number | null = null;

  if (microsoft && osm) {
    const diff = Math.abs(microsoft.areaM2 - osm.areaM2);
    const avg = (microsoft.areaM2 + osm.areaM2) / 2;
    discrepancy = (diff / avg) * 100;

    if (discrepancy <= 2) {
      confidence = "high";
    } else if (discrepancy <= 5) {
      confidence = "medium";
    } else {
      confidence = "low";
    }
  } else if (microsoft || osm) {
    confidence = "medium";
  }

  return NextResponse.json({
    microsoft,
    osm,
    confidence,
    discrepancy: discrepancy !== null ? Math.round(discrepancy * 10) / 10 : null,
    sourcesAvailable: [
      microsoft ? "Microsoft" : null,
      osm ? "OpenStreetMap" : null,
    ].filter(Boolean),
  });
}
