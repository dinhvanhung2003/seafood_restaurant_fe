"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios"; 
import { MenuItem } from "@/types/admin/product/menu";
import {UpdateMenuItemInput} from "@/types/admin/product/menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
function extractError(e: any) {
  const status = e?.response?.status;
  const data = e?.response?.data;
  const msg = Array.isArray(data?.message)
    ? data.message.join(", ")
    : (data?.message || e?.message || "Đã có lỗi xảy ra");
  return { title: status ? `Lỗi ${status}` : "Lỗi", description: msg };
}

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
async function updateMenuItem(input: UpdateMenuItemInput): Promise<MenuItem> {
  const { id, image, ...rest } = input;

  if (image) {
    const fd = new FormData();
    Object.entries(rest).forEach(([k, v]) => {
      if (typeof v === "undefined" || v === null) return;
      if (k === "isAvailable") fd.append("isAvailable", v ? "true" : "false");
      else if (k === "ingredients") fd.append("ingredients", JSON.stringify(v));
      else fd.append(k, String(v));
    });
    fd.append("image", image);
    const res = await api.patch<MenuItem>(`/menuitems/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  const payload: any = { ...rest };
  if (typeof payload.isAvailable === "boolean") {
    payload.isAvailable = payload.isAvailable ? "true" : "false";
  }
  const res = await api.patch<MenuItem>(`/menuitems/${id}`, payload);
  return res.data;
}

export function useUpdateMenuItemMutation() {
  const qc = useQueryClient();

  return useMutation<MenuItem, any, UpdateMenuItemInput, { tid?: string | number }>({
    mutationFn: updateMenuItem, // giữ nguyên hàm của bạn
    onMutate: async () => {
      const tid = toast.loading("Đang lưu thay đổi…");
      return { tid };
    },
    onSuccess: (data, _variables, ctx) => {
      // bust cache ảnh nếu cần
      const patched =
        data.image
          ? { ...data, image: data.image.includes("?") ? `${data.image}&v=${Date.now()}` : `${data.image}?v=${Date.now()}` }
          : data;

      qc.setQueryData(["menuitem", data.id], patched);
      qc.invalidateQueries({ queryKey: ["menuitems"] });

      if (ctx?.tid) toast.dismiss(ctx.tid);
      toast.success("Đã lưu", { description: "Món ăn đã được cập nhật." });
    },
    onError: (error, _variables, ctx) => {
      if (ctx?.tid) toast.dismiss(ctx.tid);
      const { title, description } = extractError(error);
      toast.error(title, { description });
    },
  });
}