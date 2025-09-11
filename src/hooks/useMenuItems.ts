// hooks/useMenuItems.ts
import {  keepPreviousData } from "@tanstack/react-query";
import { fetchMenuItems, type MenuItemsQuery } from "@/api/menuitems";

export function useMenuItems(params: MenuItemsQuery) {
  return useQuery({
    queryKey: ["menuitems", params],
    queryFn: () => fetchMenuItems(params),
    placeholderData: keepPreviousData,  // giữ trang cũ khi tải trang mới
    staleTime: 30_000,
  });
}
// hooks/useMenu.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useAreas() {
  return useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const res = await api.get("/area/get-list-area");
      return res.data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/category/list-category", {
        params: { isActive: true, type: "MENU", page: 1, limit: 100 },
      });
      return res.data?.data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useMenu(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sortBy?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["menu", params],
    queryFn: async () => {
      const res = await api.get("/menuitems/list-menuitems", {
        params: { ...params, limit: Math.min(params.limit ?? 12, 100) },
      });
      return res.data;
    },
     placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
