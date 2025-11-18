"use client";

import { createRestHooks } from "@/hooks/admin/rq";
import type { IngredientDTO, UpdateIngredientInput } from "@/types/admin/product/ingredient";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

/** Meta chuẩn */
export type PageMeta = { total: number; page: number; limit: number; pages: number };

/** Các giá trị filter tồn kho (khớp BE) */
export type StockFilter = "ALL" | "BELOW" | "OVER" | "IN_STOCK" | "OUT_OF_STOCK";

/** Query gửi lên BE */
export type ListQuery = {
  page?: number;
  limit?: number;
  q?: string;
  baseUomCode?: string;  // VD: "CAN", "KG"...
  stock?: StockFilter;
  supplierId?: string;       // radio ở sidebar
};

/** Tạo REST hooks cho resource Ingredients */
const base = createRestHooks<any, IngredientDTO, ListQuery, any, UpdateIngredientInput>({
  key: "ingredients",
  list: { path: "/inventoryitems/list-ingredients" },
  detail: { path: ({ id }: { id: string }) => `/inventoryitems/${id}` }, // GET one
  create: { path: "/inventoryitems/create", method: "post" },
  update: { path: ({ id }: { id: string }) => `/inventoryitems/${id}`, method: "put" },
  remove: { path: ({ id }: { id: string }) => `/inventoryitems/${id}`, method: "delete" },
});

export const {
  useCreateMutation: useStockInIngredient,
  useUpdateMutation: useUpdateIngredient,
  useRemoveMutation: useDeleteIngredient,
  useDetailQuery: useIngredientDetail,
} = base;

/** Restore a soft-deleted ingredient */
export function useRestoreIngredient() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string }>({
    mutationFn: async ({ id }: { id: string }) => {
      // Backend route: PATCH /inventoryitems/:id/restore
      const { data } = await api.patch(`/inventoryitems/${id}/restore`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

/** Hook danh sách có phân trang + filter */
export function useIngredients(
  page: number,
  limit: number,
  search: string,
  stock: StockFilter,
  baseUomCode?: string,
  supplierId?: string
) {
  const q = base.useListQuery({
    page,
    limit,
    q: search || undefined,
    // BE có thể không hỗ trợ 'ALL' => bỏ field khi ALL để trả về đầy đủ
    stock: stock !== "ALL" ? stock : undefined,
    baseUomCode: baseUomCode || undefined,
    supplierId: supplierId || undefined,
  });

  const items: IngredientDTO[] = useMemo(() => {
    try {
      const raw = (q.data as any);
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      return arr.map((r: any) => ({
        id: r.id,
        name: r.name,
        unitCode: r?.baseUom?.code ?? "",
        unit: r?.baseUom?.name ?? r?.baseUom?.code ?? "",
        quantity: Number(r?.quantity ?? 0),
        alertThreshold: Number(r?.alertThreshold ?? 0),
        description: r?.description ?? undefined,
        updatedAt: r?.updatedAt ?? undefined,
        isActive: !(r?.isDeleted ?? false),
        category: r?.category ? { id: r.category.id, name: r.category.name } : null,
        code: r?.code,
        suppliers: r?.suppliers ?? [],
      }));
    } catch (e) {
      // Nếu mapping lỗi, trả về [] để tránh crash UI nhưng vẫn có thể xem q.error
      return [];
    }
  }, [q.data]);

  const meta: PageMeta = (q.data as any)?.meta ?? { total: 0, page, limit, pages: 0 };

  return {
    ...q,
    data: items,
    meta,
  } as Omit<typeof q, "data"> & { data: IngredientDTO[]; meta: PageMeta };
}
