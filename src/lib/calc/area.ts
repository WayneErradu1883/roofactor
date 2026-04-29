/**
 * Geodesic area calculation using turf.js
 *
 * turf.area() computes the area of a GeoJSON polygon on a sphere,
 * which avoids projection distortion at all latitudes.
 * This is critical for South Africa (~-26 to -34 latitude).
 */

import * as turf from "@turf/turf";

/**
 * Calculate the geodesic area of a polygon defined by [lat, lng] pairs.
 * Returns area in square meters.
 */
export function calculateGeodesicArea(latlngs: [number, number][]): number {
  if (latlngs.length < 3) return 0;

  // Convert [lat, lng] to [lng, lat] for GeoJSON
  const coords = latlngs.map((ll) => [ll[1], ll[0]] as [number, number]);

  // Close the ring
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([...first] as [number, number]);
  }

  const polygon = turf.polygon([coords]);
  return turf.area(polygon);
}
