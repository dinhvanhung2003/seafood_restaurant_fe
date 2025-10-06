"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios"; 
export type MenuItem = {
  id: string;
  name: string;
  price: string; // BE trả string
  description: string | null;
  image: string | null;
  category: {
    id: string;
    name: string;
    description: string | null;
    type: "MENU";
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  isAvailable: boolean;
  ingredients: Array<{ id: string; quantity: string; note: string | null }>;
};

export type MenuItemsList = {
  data: MenuItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type MenuItemsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isAvailable?: string; // "true" | "false"
  minPrice?: number | string;
  maxPrice?: number | string;
  sortBy?: "name" | "price" | "createdAt";
  order?: "ASC" | "DESC";
};

export type HeadersMap = Record<string, string>;


/** ===== Internal API (đã gộp từ services/menu.api.ts) ===== */
async function listMenuItems(
  params: MenuItemsQuery
): Promise<{ body: MenuItemsList; headers: HeadersMap }> {
  const res = await api.get<MenuItemsList>("/menuitems/list-menuitems", { params });
  const headers: HeadersMap = {};
  Object.entries(res.headers || {}).forEach(([k, v]) => (headers[k] = String(v)));
  return { body: res.data, headers };
}

async function getMenuItemDetail(id: string): Promise<MenuItem> {
  const res = await api.get<MenuItem>(`/menuitems/${id}`);
  return res.data;
}

/** ===== Hooks ===== */
export function useMenuItemsQuery(params: MenuItemsQuery) {
  return useQuery<{ body: MenuItemsList; headers: HeadersMap }, Error>({
    queryKey: ["menuitems", params],
    queryFn: () => listMenuItems(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useMenuItemDetailQuery(id?: string) {
  return useQuery<MenuItem, Error>({
    queryKey: ["menuitem", id],
    queryFn: () => getMenuItemDetail(id!),
    enabled: Boolean(id),
  });
}
