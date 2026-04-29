/**
 * OpenStreetMap Building Footprints via Overpass API
 *
 * Queries building outlines from OpenStreetMap within a radius
 * of the target coordinates. Free, no API key required.
 */

import * as turf from "@turf/turf";

export interface BuildingFootprint {
  coordinates: [number, number][]; // [lat, lng] pairs
  areaM2: number;
  source: string;
}

const SEARCH_RADIUS_M = 50;
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export async function fetchOSMFootprints(
  lat: number,
  lng: number
): Promise<BuildingFootprint[]> {
  // Overpass QL query: find buildings within radius
  const query = `
    [out:json][timeout:10];
    (
      way["building"](around:${SEARCH_RADIUS_M},${lat},${lng});
      relation["building"](around:${SEARCH_RADIUS_M},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) return [];

    const data = await res.json();
    return parseOverpassResponse(data, lat, lng);
  } catch {
    return [];
  }
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

function parseOverpassResponse(
  data: { elements: OverpassElement[] },
  targetLat: number,
  targetLng: number
): BuildingFootprint[] {
  const nodes = new Map<number, [number, number]>();
  const ways: OverpassElement[] = [];

  // Separate nodes and ways
  for (const element of data.elements) {
    if (element.type === "node" && element.lat !== undefined && element.lon !== undefined) {
      nodes.set(element.id, [element.lat, element.lon]);
    } else if (element.type === "way" && element.nodes) {
      ways.push(element);
    }
  }

  const targetPoint = turf.point([targetLng, targetLat]);

  return ways
    .map((way) => {
      // Resolve node references to coordinates
      const latlngs: [number, number][] = [];
      for (const nodeId of way.nodes!) {
        const coord = nodes.get(nodeId);
        if (coord) latlngs.push(coord);
      }

      if (latlngs.length < 3) return null;

      // Close the polygon if not already closed
      const first = latlngs[0];
      const last = latlngs[latlngs.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        latlngs.push([...first] as [number, number]);
      }

      // Calculate area using turf (needs [lng, lat] format)
      const geoJsonCoords = latlngs.map(
        (ll) => [ll[1], ll[0]] as [number, number]
      );
      const polygon = turf.polygon([geoJsonCoords]);
      const areaM2 = turf.area(polygon);

      const centroid = turf.centroid(polygon);
      const distance = turf.distance(targetPoint, centroid, {
        units: "meters",
      });

      return {
        coordinates: latlngs.slice(0, -1), // Remove closing point for Leaflet
        areaM2,
        source: "OpenStreetMap",
        distance,
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .sort((a, b) => a.distance - b.distance)
    .map(({ coordinates, areaM2, source }) => ({
      coordinates,
      areaM2,
      source,
    }));
}
