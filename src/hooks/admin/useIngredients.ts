"use client";

import { createRestHooks } from "@/hooks/admin/rq";
import type { IngredientDTO } from "@/types/admin/product/ingredient";
import { useMemo } from "react";

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
const base = createRestHooks<any, IngredientDTO, ListQuery, any, any>({
  key: "ingredients", 
  list: { path: "/inventoryitems/list-ingredients" },
  create: { path: "/inventoryitems/create", method: "post" },
});

export const { useCreateMutation: useStockInIngredient } = base;

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
    stock: stock || "ALL",
    baseUomCode: baseUomCode || undefined,
    supplierId: supplierId || undefined, 
  });

  const items: IngredientDTO[] = useMemo(() => {
    const arr = Array.isArray((q.data as any)?.data) ? (q.data as any).data : [];
    return arr.map((r: any) => ({
      id: r.id,
      name: r.name,
       unitCode: r?.baseUom?.code ?? "", 
      unit: r?.baseUom?.name ?? r?.baseUom?.code ?? "",
      quantity: Number(r?.quantity ?? 0),
      alertThreshold: Number(r?.alertThreshold ?? 0),
      description: r?.category?.name ?? undefined, // show category ở cột Mô tả
      updatedAt: r?.updatedAt ?? undefined,
      // (tuỳ chọn) nếu muốn xài thêm:
      code: r?.code,
      suppliers: r?.suppliers ?? [],
    }));
  }, [q.data]);

  const meta: PageMeta = (q.data as any)?.meta ?? { total: 0, page, limit, pages: 0 };

  return {
    ...q,
    data: items,
    meta,
  } as Omit<typeof q, "data"> & { data: IngredientDTO[]; meta: PageMeta };
}
