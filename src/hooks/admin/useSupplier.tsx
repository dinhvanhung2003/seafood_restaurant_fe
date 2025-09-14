// hooks/admin/useSuppliers.ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { SuppliersFilter } from "@/types/types";
import type { Supplier } from "@/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateSupplierBody } from "@/types/types";
import type { UpdateBody } from "@/types/types";


type ListResp = { items: Supplier[]; total: number; page: number; limit: number };

function buildParams(page: number, limit: number, f: SuppliersFilter) {
  const p: any = { page, limit };
  if (f.q) p.q = f.q;
  if (f.status) p.status = f.status;
  if (f.supplierGroupId) p.supplierGroupId = f.supplierGroupId;
  if (f.city) p.city = f.city;
  if (typeof f.withGroup === "boolean") p.withGroup = f.withGroup;
  return p;
}

export function useSuppliers(
  page: number,
  limit: number,
  filters: any,
  initialData?: any
) {
  return useQuery({
    queryKey: ["suppliers", page, limit, filters],
    queryFn: async () => {
      const { data } = await api.get("/supplier/get-list-suppliers", {
        params: {
          page,
          limit,
          q: filters?.q || undefined,
          status: filters?.status || undefined,
          supplierGroupId: filters?.supplierGroupId || undefined,
          city: filters?.city || undefined,
          withGroup: filters?.withGroup || undefined,
        },
      });
      return data; // { items, total, page, limit }
    },
    initialData,                       // dữ liệu từ server (SSR) nếu có
    placeholderData: keepPreviousData, //  thay cho keepPreviousData ở v4
    staleTime: 30_000,                 // dữ liệu “tươi” trong 30s
    gcTime: 5 * 60_000,                // thời gian giữ cache trong bộ nhớ
  });
}
export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateSupplierBody) => {
      const { data } = await api.post("/supplier/create-supplier", body);
      return data;
    },
    onSuccess: () => {
      toast.success("Tạo nhà cung cấp thành công");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Không thể tạo nhà cung cấp";
      toast.error(String(msg));
    },
  });
}

// GET detail
export function useSupplierDetail(id?: string, enabled = true) {
  return useQuery({
    queryKey: ["supplier", id],
    enabled: !!id && enabled,
    queryFn: async () => {
      const { data } = await api.get<Supplier>(`/supplier/get/${id}`);
      return data;
    },
  });
}

// PATCH status
export function useChangeSupplierStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; status: "ACTIVE" | "INACTIVE" }) => {
      const { data } = await api.patch(
        `/supplier/${p.id}/status/${p.status}`
      );
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success("Cập nhật trạng thái thành công");
      qc.invalidateQueries({ queryKey: ["supplier", vars.id] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Đổi trạng thái thất bại");
    },
  });
}
export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; body: UpdateBody }) => {
      const { data } = await api.patch(
        `/supplier/update-supplier/${p.id}`,
        p.body
      );
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success("Cập nhật nhà cung cấp thành công");
      qc.invalidateQueries({ queryKey: ["supplier", vars.id] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Cập nhật thất bại");
    },
  });
}