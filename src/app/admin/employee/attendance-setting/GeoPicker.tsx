"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ import TĨNH icon, Next sẽ bundle đúng đường dẫn
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false }
);
const useMapEvents = dynamic(
  () => import("react-leaflet").then((m) => m.useMapEvents as any),
  { ssr: false }
) as any;

export type MapValue = { lat: number; lng: number; radius: number };

export default function MapPicker({
  value,
  onChange,
  height = 360,
  className,
}: {
  value: MapValue;
  onChange: (v: MapValue) => void;
  height?: number;
  className?: string;
}) {
  const center: LatLngExpression = [value.lat, value.lng];

  // ✅ set default icon 1 lần
  useEffect(() => {
    const DefaultIcon = L.icon({
      iconRetinaUrl: (markerIcon2x as any).src ?? (markerIcon2x as any),
      iconUrl: (markerIcon as any).src ?? (markerIcon as any),
      shadowUrl: (markerShadow as any).src ?? (markerShadow as any),
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  useEffect(() => {
    if (value.radius <= 0) onChange({ ...value, radius: 50 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Events = () => {
    useMapEvents({
      click(e: any) {
        onChange({ ...value, lat: e.latlng.lat, lng: e.latlng.lng });
      },
      wheel(e: any) {
        const dy = e.originalEvent?.deltaY ?? 0;
        if (dy > 0)
          onChange({
            ...value,
            radius: Math.max(1, Math.round(value.radius + 5)),
          });
        else
          onChange({
            ...value,
            radius: Math.max(1, Math.round(value.radius - 5)),
          });
      },
    });
    return null;
  };

  return (
    <div className={className} style={{ height }}>
      <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🔥 Marker kéo thả */}
        <Marker
          position={center}
          draggable
          eventHandlers={{
            dragend: (e: any) => {
              const { lat, lng } = e.target.getLatLng();
              onChange({ ...value, lat, lng });
            },
          }}
        />

        <Circle center={center} radius={value.radius} />
        <Events />
      </MapContainer>
    </div>
  );
}
