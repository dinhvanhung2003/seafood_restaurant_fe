"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

type UseMenuArgs = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
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

// Luôn chuẩn hoá về { data, meta }
async function fetchMenu(params: {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  withPromotions?: boolean;
}): Promise<MenuPage<MenuItemWithPromo>> {
  const safeLimit = Math.max(1, Math.min(Number(params.limit ?? 12), 100));

  const res = await api.get<ListResponse<MenuItemWithPromo>>(
    "/menuitems/list-menuitems",
    {
      params: {
        ...params,
        limit: safeLimit,
        sortBy: "name",
        order: "ASC",
        // nếu BE nhận boolean dạng string:
        withPromotions:
          typeof params.withPromotions === "boolean"
            ? String(params.withPromotions)
            : undefined,
      },
    }
  );

  const payload = res.data;
  if (Array.isArray(payload)) {
    return { data: payload, meta: null };
  }
  return { data: payload.data ?? [], meta: payload.meta ?? null };
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

  return useQuery({
    queryKey: [
      "menu",
      {
        page,
        limit,
        search: q ?? "",
        categoryId: categoryId ?? "all",
        withPromotions,
      },
    ],
    queryFn: () =>
      fetchMenu({ page, limit, search: q, categoryId: cat, withPromotions }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
