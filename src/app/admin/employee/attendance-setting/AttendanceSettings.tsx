
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  useGeoRules,
  useNetRules,
  useSaveGeo,
  useSaveNet,
  useDeleteGeo,
  useDeleteNet,
} from "@/hooks/admin/useAttendanceRules";

// ⚡ Tắt SSR cho component bản đồ để tránh lỗi window/document khi build
const MapPicker = dynamic(() => import("./GeoPicker"), { ssr: false });

export default function AttendanceSettings() {
  const geo = useGeoRules();
  const net = useNetRules();
  const saveGeo = useSaveGeo();
  const saveNet = useSaveNet();
  const delGeo = useDeleteGeo();
  const delNet = useDeleteNet();

  const [name, setName] = useState("Chi nhánh trung tâm");
  const [place, setPlace] = useState({ lat: 10.776, lng: 106.700, radius: 150 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Thiết lập chấm công</h1>

      {/* GPS */}
      <Card className="p-4 space-y-3">
        <div className="font-medium">Vùng GPS được phép</div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên vị trí"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={place.lat}
                onChange={(e) => setPlace({ ...place, lat: Number(e.target.value) })}
                placeholder="Lat"
              />
              <Input
                value={place.lng}
                onChange={(e) => setPlace({ ...place, lng: Number(e.target.value) })}
                placeholder="Lng"
              />
              <Input
                value={place.radius}
                onChange={(e) => setPlace({ ...place, radius: Math.max(1, Number(e.target.value)) })}
                placeholder="Bán kính (m)"
              />
            </div>

            {/* ⚡ Map chỉ hiển thị client-side */}
            <MapPicker
              value={place}
              onChange={setPlace}
              height={340}
              className="rounded overflow-hidden"
            />

            <Button
              onClick={() => {
                const lat = Number(place.lat);
                const lng = Number(place.lng);
                const radius = Number(place.radius);
                if (!name.trim()) return;
                if (!Number.isFinite(lat) || lat < -90 || lat > 90)
                  return alert("Lat phải [-90, 90]");
                if (!Number.isFinite(lng) || lng < -180 || lng > 180)
                  return alert("Lng phải [-180, 180]");
                if (!Number.isFinite(radius) || radius < 1)
                  return alert("Radius >= 1");

                saveGeo.mutate({ name: name.trim(), lat, lng, radius });
              }}
            >
              Thêm vùng
            </Button>
          </div>

          {/* Danh sách vùng */}
          <div className="space-y-2">
            {geo.data?.length ? (
              geo.data.map((g) => (
                <div key={g.id} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.centerLat?.toFixed(6)}, {g.centerLng?.toFixed(6)} • {g.radiusMeters}m
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => delGeo.mutate(g.id)}
                  >
                    Xoá
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Chưa có vùng nào</div>
            )}
          </div>
        </div>
      </Card>

      {/* Wi-Fi / IP */}
      <Card className="p-4 space-y-3">
        <div className="font-medium">Wi-Fi / IP được phép</div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input placeholder="Ghi chú" id="netLabel" />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="SSID" id="netSsid" />
              <Input placeholder="BSSID (aa:bb:cc:dd:ee:ff)" id="netBssid" />
              <Input placeholder="CIDR (192.168.1.0/24)" id="netCidr" />
            </div>
            <Button
              onClick={() => {
                const label = (document.getElementById("netLabel") as HTMLInputElement)?.value || undefined;
                const ssid = (document.getElementById("netSsid") as HTMLInputElement)?.value || undefined;
                const bssid = (document.getElementById("netBssid") as HTMLInputElement)?.value || undefined;
                const cidr = (document.getElementById("netCidr") as HTMLInputElement)?.value || undefined;
                saveNet.mutate({ label, ssid, bssid, cidr });
              }}
            >
              Thêm rule
            </Button>
          </div>

          <div className="space-y-2">
            {net.data?.length ? (
              net.data.map((nr) => (
                <div key={nr.id} className="flex items-center justify-between border rounded p-2">
                  <div className="text-sm">
                    <div className="font-medium">{nr.label || "Wi-Fi/IP"}</div>
                    <div className="text-xs text-muted-foreground">
                      {(nr.ssid && `SSID:${nr.ssid} `) || ""}
                      {(nr.bssid && `BSSID:${nr.bssid} `) || ""}
                      {(nr.cidr && `CIDR:${nr.cidr}`) || ""}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => delNet.mutate(nr.id)}
                  >
                    Xoá
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Chưa có rule</div>
            )}
          </div>
        </div>
      </Card>

      <Separator />
      <div className="text-xs text-muted-foreground">
        Mặc định yêu cầu đồng thời đúng <b>GPS</b> và trùng <b>Wi-Fi/IP</b> nếu bạn cấu hình.
        Nếu chưa cấu hình rule → cho phép chấm.
      </div>
    </div>
  );
}
