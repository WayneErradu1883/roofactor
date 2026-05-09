import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const geojson = searchParams.get("geojson");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === "your_google_maps_api_key") {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  // Build polygon path parameters from GeoJSON
  let pathParams = "";
  if (geojson) {
    try {
      const geo = JSON.parse(geojson);
      const features =
        geo.type === "FeatureCollection"
          ? geo.features
          : geo.type === "Polygon"
            ? [{ geometry: geo }]
            : [];

      for (const feature of features) {
        if (feature.geometry?.type === "Polygon" && feature.geometry.coordinates?.[0]) {
          const coords = feature.geometry.coordinates[0];
          // GeoJSON is [lng, lat], Static Maps needs lat,lng
          const points = coords
            .map((c: number[]) => `${c[1]},${c[0]}`)
            .join("|");
          pathParams += `&path=fillcolor:0x22c55e40|color:0x22c55eff|weight:3|${points}`;
        }
      }
    } catch {
      // Invalid GeoJSON, skip polygon overlay
    }
  }

  const staticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=640x480&scale=2&maptype=satellite${pathParams}&key=${apiKey}`;

  try {
    const res = await fetch(staticUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch static map" },
        { status: 502 }
      );
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Static map request failed" },
      { status: 500 }
    );
  }
}
