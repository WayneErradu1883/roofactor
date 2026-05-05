"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export interface PolygonData {
  latlngs: [number, number][];
  areaM2: number;
}

export interface ZoneData {
  id: string;
  latlngs: [number, number][];
  areaM2: number;
}

interface PolygonEditorProps {
  onZonesChange: (zones: ZoneData[]) => void;
  initialPolygon?: [number, number][];
  sourceLabel?: string;
  color?: string;
}

function calcGeodesicArea(latlngs: L.LatLng[]): number {
  if (L.GeometryUtil && L.GeometryUtil.geodesicArea) {
    return L.GeometryUtil.geodesicArea(latlngs);
  }
  // Fallback: use turf-style calculation if GeometryUtil missing
  return 0;
}

let zoneCounter = 0;

export default function PolygonEditor({
  onZonesChange,
  initialPolygon,
  sourceLabel,
  color = "#22c55e",
}: PolygonEditorProps) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const initializedRef = useRef(false);
  const [drawReady, setDrawReady] = useState(false);

  // Load leaflet-draw dynamically to avoid tree-shaking issues
  useEffect(() => {
    if (L.Control.Draw) {
      setDrawReady(true);
      return;
    }

    import("leaflet-draw").then(() => {
      setDrawReady(true);
    }).catch((err) => {
      console.error("Failed to load leaflet-draw:", err);
    });
  }, []);

  const emitAllZones = useCallback(
    (drawnItems: L.FeatureGroup) => {
      const zones: ZoneData[] = [];
      drawnItems.eachLayer((layer) => {
        if (layer instanceof L.Polygon) {
          const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map(
            (ll) => [ll.lat, ll.lng] as [number, number]
          );
          const areaM2 = calcGeodesicArea(layer.getLatLngs()[0] as L.LatLng[]);
          const id =
            (layer as L.Polygon & { _zoneId?: string })._zoneId ||
            `zone-${++zoneCounter}`;
          (layer as L.Polygon & { _zoneId?: string })._zoneId = id;
          zones.push({ id, latlngs, areaM2 });
        }
      });
      onZonesChange(zones);
    },
    [onZonesChange]
  );

  useEffect(() => {
    if (!drawReady) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // If there's an initial polygon, add it as zone 1
    if (initialPolygon && initialPolygon.length >= 3) {
      const polygon = L.polygon(initialPolygon, {
        color,
        fillOpacity: 0.3,
        weight: 2,
      }) as L.Polygon & { _zoneId?: string };
      polygon._zoneId = `zone-${++zoneCounter}`;
      if (sourceLabel) {
        polygon.bindTooltip(`Zone 1 (${sourceLabel})`, {
          permanent: true,
          direction: "center",
        });
      } else {
        polygon.bindTooltip("Zone 1", {
          permanent: true,
          direction: "center",
        });
      }
      drawnItems.addLayer(polygon);
      setTimeout(() => emitAllZones(drawnItems), 100);
    }

    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color, fillOpacity: 0.3, weight: 2 },
        },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        rectangle: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    map.on(L.Draw.Event.CREATED, (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      const layer = event.layer as L.Polygon & { _zoneId?: string };
      layer._zoneId = `zone-${++zoneCounter}`;
      const zoneNum = drawnItems.getLayers().length + 1;
      layer.bindTooltip(`Zone ${zoneNum}`, {
        permanent: true,
        direction: "center",
      });
      drawnItems.addLayer(layer);
      emitAllZones(drawnItems);
    });

    map.on(L.Draw.Event.EDITED, () => {
      emitAllZones(drawnItems);
    });

    map.on(L.Draw.Event.DELETED, () => {
      emitAllZones(drawnItems);
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      initializedRef.current = false;
    };
  }, [map, drawReady, initialPolygon, sourceLabel, color, emitAllZones]);

  return null;
}
