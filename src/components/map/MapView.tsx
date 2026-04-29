"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet in webpack/Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapViewProps {
  center: [number, number];
  zoom: number;
  onMapReady?: (map: L.Map) => void;
  children?: React.ReactNode;
  googleApiKey?: string;
}

function MapEvents({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  const called = useRef(false);

  useEffect(() => {
    if (onMapReady && !called.current) {
      called.current = true;
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

export function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [map, center, zoom]);
  return null;
}

export default function MapView({
  center,
  zoom,
  onMapReady,
  children,
  googleApiKey,
}: MapViewProps) {
  const googleSatUrl = googleApiKey
    ? `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${googleApiKey}`
    : "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={true}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satellite">
          <TileLayer
            url={googleSatUrl}
            attribution="&copy; Google"
            maxZoom={21}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite + Labels">
          <TileLayer
            url={
              googleApiKey
                ? `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${googleApiKey}`
                : "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            }
            attribution="&copy; Google"
            maxZoom={21}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <MapEvents onMapReady={onMapReady} />
      {children}
    </MapContainer>
  );
}
