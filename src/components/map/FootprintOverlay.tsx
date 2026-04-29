"use client";

import { Polygon, Tooltip } from "react-leaflet";

interface FootprintOverlayProps {
  coordinates: [number, number][];
  source: string;
  areaM2: number;
  color: string;
  visible: boolean;
}

export default function FootprintOverlay({
  coordinates,
  source,
  areaM2,
  color,
  visible,
}: FootprintOverlayProps) {
  if (!visible || coordinates.length < 3) return null;

  return (
    <Polygon
      positions={coordinates}
      pathOptions={{
        color,
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "5, 10",
      }}
    >
      <Tooltip permanent direction="center">
        {source}: {areaM2.toFixed(1)} m²
      </Tooltip>
    </Polygon>
  );
}
