"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

type UseMenuArgs = {
  page: number;
  limit: number;
  search: string;
  categoryId: string;
  withPromotions?: boolean;
};

type MenuItemWithPromo = {
  id: string;
  name: string;
  image?: string;
  category?: { id: string; name: string };
  price: number;
  priceAfterDiscount?: number;
  discountAmount?: number;
  badge?: string | null;
};

type MenuPage<T> = { data: T[]; meta: any | null };
type ListResponse<T> = { data: T[]; meta: any } | T[];
// Nếu BE trả về { data, meta } thì giữ nguyên kiểu trả về như cũ
async function fetchMenu(params: {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  withPromotions?: boolean;
}): Promise<MenuPage<MenuItemWithPromo>> {
  const safeLimit = Math.max(1, Math.min(Number(params.limit ?? 12), 100));
  const { data } = await api.get<ListResponse<MenuItemWithPromo>>(
    "/menuitems/list-menuitems",
    {
      params: {
        ...params,
        limit: safeLimit,
        sortBy: "name",
        order: "ASC",
        withPromotions: params.withPromotions ? "true" : "false",
      },
    }
  );

  // 🔧 Normalize: luôn thành { data, meta }
  if (Array.isArray(data)) {
    return { data, meta: null };
  }
  return { data: data.data, meta: (data as any).meta ?? null };
}


export function useMenu({
  page,
  limit,
  search,
  categoryId,
  withPromotions = true,
}: UseMenuArgs) {
  const cat = categoryId === "all" ? undefined : categoryId;
  const q = search || undefined;

  return useQuery<MenuPage<MenuItemWithPromo>>({
    queryKey: ["menu", { page, limit, search: q, categoryId: cat, withPromotions }],
    queryFn: () => fetchMenu({ page, limit, search: q, categoryId: cat, withPromotions }),
    enabled: true,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

