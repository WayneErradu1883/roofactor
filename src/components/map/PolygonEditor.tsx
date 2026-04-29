"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

export interface PolygonData {
  latlngs: [number, number][];
  areaM2: number;
}

interface PolygonEditorProps {
  onPolygonChange: (polygon: PolygonData | null) => void;
  initialPolygon?: [number, number][];
  sourceLabel?: string;
  color?: string;
}

function calcGeodesicArea(latlngs: L.LatLng[]): number {
  return L.GeometryUtil.geodesicArea(latlngs);
}

export default function PolygonEditor({
  onPolygonChange,
  initialPolygon,
  sourceLabel,
  color = "#3388ff",
}: PolygonEditorProps) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const initializedRef = useRef(false);

  const emitChange = useCallback(
    (layer: L.Polygon | null) => {
      if (!layer) {
        onPolygonChange(null);
        return;
      }
      const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map(
        (ll) => [ll.lat, ll.lng] as [number, number]
      );
      const areaM2 = calcGeodesicArea(layer.getLatLngs()[0] as L.LatLng[]);
      onPolygonChange({ latlngs, areaM2 });
    },
    [onPolygonChange]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // If there's an initial polygon, add it
    if (initialPolygon && initialPolygon.length >= 3) {
      const polygon = L.polygon(initialPolygon, {
        color,
        fillOpacity: 0.3,
        weight: 2,
      });
      if (sourceLabel) {
        polygon.bindTooltip(sourceLabel, { permanent: true, direction: "center" });
      }
      drawnItems.addLayer(polygon);

      // Emit the initial area
      setTimeout(() => emitChange(polygon), 100);
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
      // Clear previous polygons — one polygon at a time
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      emitChange(event.layer as L.Polygon);
    });

    map.on(L.Draw.Event.EDITED, () => {
      const layers = drawnItems.getLayers();
      if (layers.length > 0) {
        emitChange(layers[0] as L.Polygon);
      }
    });

    map.on(L.Draw.Event.DELETED, () => {
      if (drawnItems.getLayers().length === 0) {
        emitChange(null);
      }
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, initialPolygon, sourceLabel, color, emitChange]);

  return null;
}
