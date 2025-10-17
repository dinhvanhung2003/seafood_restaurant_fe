"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

/** FE shape chuẩn hoá */
export type GeoRule = {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
  createdAt: string;
};

export type NetRule = {
  id: string;
  label?: string | null;
  ssid?: string | null;
  bssid?: string | null;
  cidr?: string | null;
  isActive: boolean;
  createdAt: string;
};

/** API + Chuẩn hoá dữ liệu trả về */
const attendanceRulesApi = {
  listGeo: async (): Promise<GeoRule[]> => {
    const r = await api.get("/admin/attendance/rules/geo");
    const raw = Array.isArray(r.data) ? r.data : r.data?.items ?? [];

    return raw.map((x: any) => ({
      id: x.id,
      name: x.name ?? x.label ?? "GPS",
      centerLat: x.centerLat ?? x.lat,                         // alias
      centerLng: x.centerLng ?? x.lng,                         // alias
      radiusMeters: x.radiusMeters ?? x.radiusMeter ?? x.radius ?? 0, // alias
      isActive: x.isActive ?? true,
      createdAt: x.createdAt ?? "",
    })) as GeoRule[];
  },

  listNet: async (): Promise<NetRule[]> => {
    const r = await api.get("/admin/attendance/rules/net");
    const raw = Array.isArray(r.data) ? r.data : r.data?.items ?? [];
    return raw.map((x: any) => ({
      id: x.id,
      label: x.label ?? null,
      ssid: x.ssid ?? null,
      bssid: x.bssid ?? null,
      cidr: x.cidr ?? null,
      isActive: x.isActive ?? true,
      createdAt: x.createdAt ?? "",
    })) as NetRule[];
  },

  /** FE chỉ gửi lat/lng/radius (BE vẫn nhận alias nếu còn giữ code cũ) */
  createGeo: async (payload: { name: string; lat: number; lng: number; radius: number; isActive?: boolean; }) => {
    const r = await api.post("/admin/attendance/rules/geo", payload);
    return r.data;
  },
  deleteGeo: async (id: string) => {
    const r = await api.delete(`/admin/attendance/rules/geo/${id}`);
    return r.data;
  },

  createNet: async (payload: { label?: string; ssid?: string; bssid?: string; cidr?: string; isActive?: boolean; }) => {
    const r = await api.post("/admin/attendance/rules/net", payload);
    return r.data;
  },
  deleteNet: async (id: string) => {
    const r = await api.delete(`/admin/attendance/rules/net/${id}`);
    return r.data;
  },
};

const qk = {
  geo: ["rules", "geo"] as const,
  net: ["rules", "net"] as const,
};

/** Hooks */
export function useGeoRules() {
  return useQuery({ queryKey: qk.geo, queryFn: attendanceRulesApi.listGeo });
}
export function useNetRules() {
  return useQuery({ queryKey: qk.net, queryFn: attendanceRulesApi.listNet });
}
export function useSaveGeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceRulesApi.createGeo,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.geo }),
  });
}
export function useDeleteGeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceRulesApi.deleteGeo,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.geo }),
  });
}
export function useSaveNet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceRulesApi.createNet,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.net }),
  });
}
export function useDeleteNet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceRulesApi.deleteNet,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.net }),
  });
}
