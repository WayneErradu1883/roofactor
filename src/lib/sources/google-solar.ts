/**
 * Google Solar API — BuildingInsights endpoint
 *
 * Returns roof segment data including pitch angles detected from
 * aerial/satellite imagery. Coverage varies — mainly US, Europe,
 * and parts of the Global South. Falls back gracefully when
 * unavailable for a given location.
 */

interface RoofSegment {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: {
    areaMeters2: number;
    groundAreaMeters2: number;
    sunshineQuantiles: number[];
  };
  center: { latitude: number; longitude: number };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  planeHeightAtCenterMeters: number;
}

interface BuildingInsightsResponse {
  name: string;
  center: { latitude: number; longitude: number };
  boundingBox: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  imageryDate: { year: number; month: number; day: number };
  imageryQuality: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    roofSegmentStats: RoofSegment[];
    wholeRoofStats: {
      areaMeters2: number;
      groundAreaMeters2: number;
      sunshineQuantiles: number[];
    };
  };
}

export interface SolarRoofData {
  /** Weighted average pitch across all roof segments */
  avgPitchDegrees: number;
  /** Pitch of the largest roof segment */
  dominantPitchDegrees: number;
  /** Individual segment details */
  segments: {
    pitchDegrees: number;
    azimuthDegrees: number;
    areaM2: number;
  }[];
  /** Total roof area from Solar API */
  totalRoofAreaM2: number;
  /** Imagery quality level */
  imageryQuality: string;
}

export async function fetchGoogleSolarData(
  lat: number,
  lng: number
): Promise<SolarRoofData | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=MEDIUM&key=${apiKey}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (!res.ok) {
    // 404 = no data for this location, not an error
    if (res.status === 404) return null;
    console.error(`Google Solar API error: ${res.status}`);
    return null;
  }

  const data: BuildingInsightsResponse = await res.json();
  const segments = data.solarPotential?.roofSegmentStats;

  if (!segments || segments.length === 0) return null;

  // Find the largest segment (dominant pitch)
  const sorted = [...segments].sort(
    (a, b) => b.stats.areaMeters2 - a.stats.areaMeters2
  );
  const dominantPitchDegrees = sorted[0].pitchDegrees;

  // Weighted average pitch by area
  const totalArea = segments.reduce((sum, s) => sum + s.stats.areaMeters2, 0);
  const avgPitchDegrees =
    totalArea > 0
      ? segments.reduce(
          (sum, s) => sum + s.pitchDegrees * s.stats.areaMeters2,
          0
        ) / totalArea
      : dominantPitchDegrees;

  return {
    avgPitchDegrees: Math.round(avgPitchDegrees * 10) / 10,
    dominantPitchDegrees: Math.round(dominantPitchDegrees * 10) / 10,
    segments: segments.map((s) => ({
      pitchDegrees: Math.round(s.pitchDegrees * 10) / 10,
      azimuthDegrees: Math.round(s.azimuthDegrees * 10) / 10,
      areaM2: Math.round(s.stats.areaMeters2 * 100) / 100,
    })),
    totalRoofAreaM2: Math.round(totalArea * 100) / 100,
    imageryQuality: data.imageryQuality,
  };
}
