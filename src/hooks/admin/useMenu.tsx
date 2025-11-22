"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { MenuItem } from "@/types/admin/product/menu";
import { UpdateMenuItemInput } from "@/types/admin/product/menu";
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
/** Map known BE error codes to friendly Vietnamese messages */
const BACKEND_ERROR_TRANSLATIONS: Record<string, string> = {
  MENU_ITEM_NOT_FOUND: "Món ăn không tồn tại",
  MENU_ITEM_IN_USE_BY_ORDERS:
    "Món đang được sử dụng trong đơn hàng, không thể xoá",
  MENU_ITEM_IN_USE_BY_KITCHEN_TICKETS:
    "Món đang được sử dụng trên phiếu bếp, không thể xoá",
  MENU_ITEM_IN_USE_BY_PROMOTIONS:
    "Món đang được áp dụng trong khuyến mãi, không thể xoá",
  MENU_ITEM_HAS_COMBO_CHILDREN: "Món là combo cha, không thể xoá",
  MENU_ITEM_IS_COMBO_COMPONENT:
    "Món là thành phần của combo khác, không thể xoá",
  IMAGE_TYPE_NOT_ALLOWED: "File ảnh không hợp lệ (chỉ JPG/PNG/WebP/GIF)",
  // Add more mappings here as backend provides codes
};

function extractError(e: any) {
  const status = e?.response?.status;
  const data = e?.response?.data;

  // Backend sometimes returns an `errorMessage` code (e.g., MENU_ITEM_IN_USE_BY_ORDERS)
  const code = data?.errorMessage ?? data?.code ?? undefined;
  const translated = code
    ? BACKEND_ERROR_TRANSLATIONS[String(code)]
    : undefined;

  const msg =
    translated ??
    (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
    (typeof data === "string" ? data : undefined) ??
    e?.message ??
    "Đã có lỗi xảy ra";

  const title = status ? `Lỗi ${status}` : "Lỗi";
  return { title, description: msg };
}

/** ===== Internal API (đã gộp từ services/menu.api.ts) ===== */
async function listMenuItems(
  params: MenuItemsQuery
): Promise<{ body: MenuItemsList; headers: HeadersMap }> {
  const res = await api.get<MenuItemsList>("/menuitems/list-menuitems", {
    params,
  });
  const headers: HeadersMap = {};
  Object.entries(res.headers || {}).forEach(
    ([k, v]) => (headers[k] = String(v))
  );
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

  // Chuẩn hoá ingredients
  const preparedIngredients = (rest as any).ingredients
    ? (rest as any).ingredients.map((it: any) => ({
        inventoryItemId: String(it.inventoryItemId),
        quantity: Number(it.quantity ?? it.selectedQty ?? 0),
        selectedQty: Number(it.quantity ?? it.selectedQty ?? 0),
        note: it.note ?? undefined,
        uomCode: it.uomCode ?? undefined,
      }))
    : undefined;

  if (image) {
    const fd = new FormData();

    Object.entries(rest).forEach(([k, v]) => {
      if (v === undefined || v === null) return;

      if (k === "isAvailable" || k === "isReturnable") {
        // 👈 cả 2 đều phải gửi dạng "true"/"false"
        fd.append(k, (v as boolean) ? "true" : "false");
      } else if (k === "ingredients") {
        fd.append("ingredients", JSON.stringify(preparedIngredients ?? v));
      } else {
        fd.append(k, String(v));
      }
    });

    fd.append("image", image); // field trùng với FileInterceptor('image')

    const res = await api.patch<MenuItem>(`/menuitems/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  // ----- Nhánh không có image: vẫn gửi JSON như cũ -----
  const payload: any = { ...rest };
  if (typeof payload.isAvailable === "boolean") {
    payload.isAvailable = payload.isAvailable ? "true" : "false";
  }
  if (typeof payload.isReturnable === "boolean") {
    payload.isReturnable = payload.isReturnable ? "true" : "false";
  }
  if (preparedIngredients) payload.ingredients = preparedIngredients;

  const res = await api.patch<MenuItem>(`/menuitems/${id}`, payload);
  return res.data;
}

export function useUpdateMenuItemMutation() {
  const qc = useQueryClient();

  return useMutation<
    MenuItem,
    any,
    UpdateMenuItemInput,
    { tid?: string | number }
  >({
    mutationFn: updateMenuItem, // giữ nguyên hàm của bạn
    onMutate: async () => {
      const tid = toast.loading("Đang lưu thay đổi…");
      return { tid };
    },
    onSuccess: (data, _variables, ctx) => {
      // bust cache ảnh nếu cần
      const patched = data.image
        ? {
            ...data,
            image: data.image.includes("?")
              ? `${data.image}&v=${Date.now()}`
              : `${data.image}?v=${Date.now()}`,
          }
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

/** DELETE */
export function useDeleteMenuItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/menuitems/${id}`);
      return id;
    },
    onMutate: (id: string) => {
      const tid = toast.loading("Đang xoá món…");

      // Optimistic: remove from cached menuitems lists
      const entries = qc.getQueryCache().findAll({ queryKey: ["menuitems"] });
      for (const entry of entries) {
        const key = entry.queryKey;
        const prev = qc.getQueryData<any>(key as any);
        if (prev?.body?.data) {
          qc.setQueryData(key as any, {
            ...prev,
            body: {
              ...prev.body,
              data: prev.body.data.filter((x: any) => x.id !== id),
              meta: {
                ...prev.body.meta,
                total: Math.max(0, prev.body.meta.total - 1),
              },
            },
          });
        }
      }
      return { tid };
    },
    onSuccess: (_id, _vars, ctx) => {
      if (ctx?.tid) toast.dismiss(ctx.tid);
      toast.success("Đã xóa món");
      qc.invalidateQueries({ queryKey: ["menuitems"] });
    },
    onError: (e, _id, ctx) => {
      if (ctx?.tid) toast.dismiss(ctx.tid);
      const { title, description } = extractError(e);
      toast.error(title, { description });
      qc.invalidateQueries({ queryKey: ["menuitems"] });
    },
  });
}
