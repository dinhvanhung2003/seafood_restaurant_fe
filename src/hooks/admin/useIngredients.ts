// hooks/admin/useIngredients.ts
"use client";
import { createRestHooks } from "@/hooks/admin/rq";
import type { IngredientDTO } from "@/types/admin/product/ingredient";
import { useMemo } from "react";

type PageMeta = { total: number; page: number; limit: number; pages: number };

type ListQuery = {
  page?: number;
  limit?: number;
  q?: string;
};

const base = createRestHooks<
  any,           // TList raw { data, meta, ... }
  IngredientDTO, // TItem
  ListQuery,     // ✅ TListQuery
  any,           // TCreateDto
  any            // TUpdateDto
>({
  key: "ingredients",
  list: { path: "/inventoryitems/list-ingredients" },
  create: { path: "/inventoryitems/stockin-ingredients", method: "post" },
});

export const { useCreateMutation: useStockInIngredient } = base;

export function useIngredients(page: number, limit: number, search: string) {
  // giờ truyền params OK vì TListQuery không còn là void
  const q = base.useListQuery({ page, limit, q: search || undefined });

  const items: IngredientDTO[] = useMemo(() => {
    const arr = Array.isArray((q.data as any)?.data) ? (q.data as any).data : [];
    return arr.map((r: any) => ({
      id: r.id,
      name: r.name,
      unit: r?.baseUom?.name ?? r?.baseUom?.code ?? "",
      quantity: Number(r?.quantity ?? 0),
      alertThreshold: Number(r?.alertThreshold ?? 0),
      description: r?.category?.name ?? undefined,
      updatedAt: r?.updatedAt ?? undefined,
    }));
  }, [q.data]);

  const meta: PageMeta = (q.data as any)?.meta ?? { total: 0, page, limit, pages: 0 };

  return { ...q, data: items, meta } as Omit<typeof q, "data"> & {
    data: IngredientDTO[];
    meta: PageMeta;
  };
}
