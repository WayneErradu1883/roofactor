/**
 * Microsoft Global ML Building Footprints
 *
 * Uses the open building footprints dataset via the Planetary Computer STAC API.
 * Coverage: all of Africa (~500M buildings), free to use.
 *
 * We query for building footprints within a small bounding box around the target
 * coordinates and return the closest match.
 */

import * as turf from "@turf/turf";

export interface BuildingFootprint {
  coordinates: [number, number][]; // [lat, lng] pairs
  areaM2: number;
  source: string;
}

const SEARCH_RADIUS_M = 50; // search within 50m of the target point

export async function fetchMicrosoftFootprints(
  lat: number,
  lng: number
): Promise<BuildingFootprint[]> {
  // Create a bounding box around the point
  const point = turf.point([lng, lat]);
  const buffered = turf.buffer(point, SEARCH_RADIUS_M, { units: "meters" });
  if (!buffered) return [];

  const bbox = turf.bbox(buffered);
  const [west, south, east, north] = bbox;

  // Query Microsoft's building footprints via Planetary Computer
  const url = `https://planetarycomputer.microsoft.com/api/stac/v1/search`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collections: ["ms-buildings"],
        bbox: [west, south, east, north],
        limit: 10,
      }),
    });

    if (!res.ok) {
      // Fallback: try the direct GeoJSON tile approach
      return await fetchMicrosoftFootprintsDirect(lat, lng, bbox);
    }

    const data = await res.json();
    return parseGeoJSONFeatures(data.features || [], lat, lng);
  } catch {
    // Fallback to direct tile approach
    return await fetchMicrosoftFootprintsDirect(lat, lng, bbox);
  }
}

/**
 * Direct approach: query Microsoft building footprints from their
 * open data distribution via quadkey-based tile downloads.
 */
async function fetchMicrosoftFootprintsDirect(
  lat: number,
  lng: number,
  bbox: number[]
): Promise<BuildingFootprint[]> {
  const [west, south, east, north] = bbox;

  // Try the open buildings API endpoint
  const url = `https://tiles.openaerialmap.org/microsoft-buildings?bbox=${west},${south},${east},${north}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    return parseGeoJSONFeatures(data.features || [], lat, lng);
  } catch {
    return [];
  }
}

function parseGeoJSONFeatures(
  features: GeoJSONFeature[],
  targetLat: number,
  targetLng: number
): BuildingFootprint[] {
  const targetPoint = turf.point([targetLng, targetLat]);

  return features
    .filter(
      (f: GeoJSONFeature) =>
        f.geometry?.type === "Polygon" && f.geometry.coordinates?.length > 0
    )
    .map((f: GeoJSONFeature) => {
      const coords = f.geometry.coordinates[0];
      // GeoJSON is [lng, lat], we need [lat, lng] for Leaflet
      const latlngs: [number, number][] = coords.map(
        (c: number[]) => [c[1], c[0]] as [number, number]
      );

      const polygon = turf.polygon([coords]);
      const areaM2 = turf.area(polygon);
      const centroid = turf.centroid(polygon);
      const distance = turf.distance(targetPoint, centroid, {
        units: "meters",
      });

      return { coordinates: latlngs, areaM2, source: "Microsoft", distance };
    })
    .sort(
      (a: { distance: number }, b: { distance: number }) =>
        a.distance - b.distance
    )
    .map(
      ({
        coordinates,
        areaM2,
        source,
      }: {
        coordinates: [number, number][];
        areaM2: number;
        source: string;
      }) => ({
        coordinates,
        areaM2,
        source,
      })
    );
}

interface GeoJSONFeature {
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties?: Record<string, unknown>;
}
