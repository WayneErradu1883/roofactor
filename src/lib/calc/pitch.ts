/**
 * Roof pitch adjustment
 *
 * A roof's actual surface area is larger than its 2D footprint
 * because of the slope. The relationship is:
 *
 *   surface_area = footprint_area / cos(pitch_angle)
 *
 * For example:
 *   - Flat (0°):     100m² → 100.0m² (factor 1.000)
 *   - Low (15°):     100m² → 103.5m² (factor 1.035)
 *   - Standard (22.5°): 100m² → 108.2m² (factor 1.082)
 *   - Steep (35°):   100m² → 122.1m² (factor 1.221)
 *   - Very steep (45°): 100m² → 141.4m² (factor 1.414)
 */

export const PITCH_PRESETS = [
  { label: "Flat", degrees: 0, description: "Flat roof, no slope" },
  { label: "Low", degrees: 15, description: "Gentle slope" },
  { label: "Standard", degrees: 22.5, description: "Most common residential" },
  { label: "Steep", degrees: 35, description: "Steep residential" },
  { label: "Very Steep", degrees: 45, description: "Very steep pitch" },
] as const;

/**
 * Convert pitch in degrees to the surface area multiplier.
 */
export function pitchMultiplier(pitchDegrees: number): number {
  if (pitchDegrees <= 0) return 1;
  const radians = (pitchDegrees * Math.PI) / 180;
  return 1 / Math.cos(radians);
}

/**
 * Calculate the actual roof surface area given footprint area and pitch.
 */
export function calculateSurfaceArea(
  footprintAreaM2: number,
  pitchDegrees: number
): number {
  return footprintAreaM2 * pitchMultiplier(pitchDegrees);
}

/**
 * For multi-zone roofs: calculate total surface area from
 * multiple sections with different pitches.
 */
export interface RoofZone {
  footprintAreaM2: number;
  pitchDegrees: number;
}

export function calculateMultiZoneSurfaceArea(zones: RoofZone[]): number {
  return zones.reduce(
    (total, zone) =>
      total + calculateSurfaceArea(zone.footprintAreaM2, zone.pitchDegrees),
    0
  );
}
