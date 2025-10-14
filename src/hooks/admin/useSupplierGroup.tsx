// hooks/admin/useSupplierGroup.ts
"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

/* ======================= Types ======================= */
export type SupplierGroupStatus = "ACTIVE" | "INACTIVE";

export type SupplierGroup = {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  status: SupplierGroupStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type SupplierGroupListParams = {
  page?: number;
  limit?: number;
  search?: string;
  // ⬇️ KHÔNG dùng "" — để undefined khi “Tất cả”
  status?: SupplierGroupStatus | undefined;
  sortBy?: "createdAt" | "name" | "code";
  sortOrder?: "ASC" | "DESC";
};

/* ======================= Query Keys ======================= */
const qk = {
  supplierGroups: (p?: Record<string, any>) =>
    ["supplierGroups", { ...(p ?? {}) }] as const,
};

/* ======================= Helpers ======================= */
function getErrMsg(err: any) {
  const d = err?.response?.data;
  if (typeof d === "string") return d;
  if (d?.message) return Array.isArray(d.message) ? d.message.join(", ") : String(d.message);
  return err?.message || "Có lỗi xảy ra";
}

function toInt(n: any, def: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return def;
  return Math.floor(v);
}

function normalizeListParams(p?: SupplierGroupListParams) {
  const pageRaw = p?.page ?? 1;
  const limitRaw = p?.limit ?? 10;

  // ép kiểu + clamp: page ≥1, limit ∈ [1,100]
  const page = Math.max(1, toInt(pageRaw, 1));
  const limit = Math.max(1, Math.min(100, toInt(limitRaw, 10)));

  return {
    page,
    limit,
    search: p?.search?.trim() || undefined,
    status: p?.status || undefined,
    sortBy: p?.sortBy ?? "createdAt",
    sortOrder: p?.sortOrder ?? "DESC",
  } as const;
}

/* ======================= Hook ======================= */
export function useSupplierGroups(params?: SupplierGroupListParams) {
  const qc = useQueryClient();

  // dùng params đã chuẩn hoá để tránh 400: page/limit invalid
  const norm = normalizeListParams(params);

  /* -------- LIST -------- */
  const listQuery = useQuery({
    queryKey: qk.supplierGroups(norm),
    queryFn: async () => {
      const { data } = await api.get<{ data: SupplierGroup[]; meta: any }>(
        "/suppliergroup/get-all-supplier-groups",
        { params: norm }
      );
      return data.data;
    },
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (listQuery.isError) {
      toast.error(`Không tải được Nhóm NCC: ${getErrMsg(listQuery.error)}`, {
        id: "suppliergroups-list-error",
      });
    }
  }, [listQuery.isError, listQuery.error]);

  /* -------- CREATE (optimistic + toast) -------- */
  const createMutation = useMutation({
    mutationFn: async (body: {
      name: string;
      description?: string;
      status?: SupplierGroupStatus;
    }) => {
      const { data } = await api.post<SupplierGroup>(
        "/suppliergroup/create-supplier-group",
        { status: "ACTIVE", ...body }
      );
      return data;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: qk.supplierGroups(norm) });
      const key = qk.supplierGroups(norm);
      const prev = qc.getQueryData<SupplierGroup[]>(key);

      const optimistic: SupplierGroup = {
        id: `optimistic-${crypto.randomUUID()}`,
        name: payload.name,
        description: payload.description,
        status: "ACTIVE",
      } as SupplierGroup;

      if (prev) qc.setQueryData<SupplierGroup[]>(key, [optimistic, ...prev]);

      const tid = toast.loading("Đang tạo nhóm…");
      return { prev, tid };
    },
    onSuccess: (res, _vars, ctx) => {
      toast.success(`Đã tạo nhóm “${res.name}”`, { id: ctx?.tid });
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.supplierGroups(norm), ctx.prev);
      toast.error(`Tạo nhóm thất bại: ${getErrMsg(e)}`, { id: ctx?.tid });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.supplierGroups(norm) });
    },
  });

  /* -------- UPDATE (optimistic + toast) -------- */
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data: body,
    }: {
      id: string;
      data: Partial<Pick<SupplierGroup, "name" | "description" | "status">>;
    }) => {
      const { data } = await api.patch<SupplierGroup>(
        `/suppliergroup/update-suppliergroup/${id}`,
        body
      );
      return data;
    },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: qk.supplierGroups(norm) });
      const key = qk.supplierGroups(norm);
      const prev = qc.getQueryData<SupplierGroup[]>(key);

      if (prev) {
        qc.setQueryData<SupplierGroup[]>(
          key,
          prev.map((g) => (g.id === id ? { ...g, ...data } : g))
        );
      }

      const tid = toast.loading("Đang lưu thay đổi…");
      return { prev, tid };
    },
    onSuccess: (res, _vars, ctx) => {
      toast.success(`Đã cập nhật nhóm “${res.name}”`, { id: ctx?.tid });
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.supplierGroups(norm), ctx.prev);
      toast.error(`Cập nhật thất bại: ${getErrMsg(e)}`, { id: ctx?.tid });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.supplierGroups(norm) });
    },
  });

  /* -------- DEACTIVATE (optimistic + toast) -------- */
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<{ success: boolean }>(
        `/suppliergroup/${id}/deactivate`
      );
      return data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.supplierGroups(norm) });
      const key = qk.supplierGroups(norm);
      const prev = qc.getQueryData<SupplierGroup[]>(key);

      if (prev) {
        qc.setQueryData<SupplierGroup[]>(
          key,
          prev.filter((g) => g.id !== id)
        );
      }

      const tid = toast.loading("Đang ngừng hoạt động nhóm…");
      return { prev, tid };
    },
    onSuccess: (_res, _vars, ctx) => {
      toast.success("Đã ngừng hoạt động nhóm", { id: ctx?.tid });
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.supplierGroups(norm), ctx.prev);
      toast.error(`Thao tác thất bại: ${getErrMsg(e)}`, { id: ctx?.tid });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.supplierGroups(norm) });
    },
  });

  /* -------- API surface -------- */
  return {
    // list
    groups: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    refetch: listQuery.refetch,

    // actions
    createGroup: createMutation.mutateAsync,
    updateGroup: updateMutation.mutateAsync,
    deactivateGroup: deactivateMutation.mutateAsync,

    // statuses (tuỳ UI dùng)
    createStatus: {
      isPending: createMutation.isPending,
      isSuccess: createMutation.isSuccess,
      error: (createMutation.error as Error) ?? null,
    },
    updateStatus: {
      isPending: updateMutation.isPending,
      isSuccess: updateMutation.isSuccess,
      error: (updateMutation.error as Error) ?? null,
    },
    deactivateStatus: {
      isPending: deactivateMutation.isPending,
      isSuccess: deactivateMutation.isSuccess,
      error: (deactivateMutation.error as Error) ?? null,
    },
  };
}
