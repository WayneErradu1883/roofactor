/**
 * Multi-source validation logic
 *
 * Compares building footprint areas from different sources
 * and produces a confidence score.
 */

export interface ValidationResult {
  confidence: "high" | "medium" | "low";
  discrepancyPercent: number | null;
  message: string;
}

export function validateSources(
  areas: { source: string; areaM2: number }[]
): ValidationResult {
  if (areas.length === 0) {
    return {
      confidence: "low",
      discrepancyPercent: null,
      message: "No data sources available. Draw the outline manually.",
    };
  }

  if (areas.length === 1) {
    return {
      confidence: "medium",
      discrepancyPercent: null,
      message: `Only ${areas[0].source} data available. Verify visually on satellite imagery.`,
    };
  }

  // Compare all pairs
  let maxDiscrepancy = 0;
  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      const diff = Math.abs(areas[i].areaM2 - areas[j].areaM2);
      const avg = (areas[i].areaM2 + areas[j].areaM2) / 2;
      const pct = (diff / avg) * 100;
      if (pct > maxDiscrepancy) maxDiscrepancy = pct;
    }
  }

  if (maxDiscrepancy <= 2) {
    return {
      confidence: "high",
      discrepancyPercent: maxDiscrepancy,
      message: `Sources agree within ${maxDiscrepancy.toFixed(1)}%. High confidence.`,
    };
  }

  if (maxDiscrepancy <= 5) {
    return {
      confidence: "medium",
      discrepancyPercent: maxDiscrepancy,
      message: `Sources differ by ${maxDiscrepancy.toFixed(1)}%. Verify the outline carefully.`,
    };
  }

  return {
    confidence: "low",
    discrepancyPercent: maxDiscrepancy,
    message: `Sources differ by ${maxDiscrepancy.toFixed(1)}%. Manual verification strongly recommended.`,
  };
}
