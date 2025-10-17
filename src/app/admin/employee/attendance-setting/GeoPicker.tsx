"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import L, { LatLngExpression } from "leaflet";

// import css chỉ chạy được trong client
import "leaflet/dist/leaflet.css";

// tắt SSR cho react-leaflet
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker       = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Circle       = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false });
const useMapEvents = dynamic(() => import("react-leaflet").then(m => m.useMapEvents as any), { ssr: false }) as any;

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

  // ✅ chỉ chạy khi client đã có window/document
  useEffect(() => {
    // fix icon không hiện trong Next
    import("leaflet/dist/images/marker-icon-2x.png").then((marker2x) => {
      import("leaflet/dist/images/marker-icon.png").then((marker) => {
        import("leaflet/dist/images/marker-shadow.png").then((shadow) => {
          delete (L.Icon.Default as any).imagePath;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: marker2x.default,
            iconUrl: marker.default,
            shadowUrl: shadow.default,
          });
        });
      });
    });
  }, []);

  // giữ radius dương
  useEffect(() => {
    if (value.radius <= 0) onChange({ ...value, radius: 50 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Component con để handle click + wheel */
  const Events = () => {
    useMapEvents({
      click(e: any) {
        onChange({ ...value, lat: e.latlng.lat, lng: e.latlng.lng });
      },
      wheel(e: WheelEvent) {
        if ((e as any).deltaY > 0)
          onChange({ ...value, radius: Math.max(1, Math.round(value.radius + 5)) });
        else
          onChange({ ...value, radius: Math.max(1, Math.round(value.radius - 5)) });
      },
    });
    return null;
  };

  return (
    <div className={className} style={{ height }}>
      <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} />
        <Circle center={center} radius={value.radius} />
        <Events />
      </MapContainer>
    </div>
  );
}
