"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

/** ===== Types ===== */
export type ComboComponent = { itemId: string; quantity: number };
export type ComboItem = {
  id: string;
  name: string;
  price: string | number;
  description: string | null;
  image: string | null;
  isAvailable: boolean;
  isCombo?: true;
  components?: Array<{
    id: string;
    quantity: string | number;
    item: { id: string; name: string; price: string | number; image: string | null; isCombo: boolean };
  }>;
};

export type ComboListResp = {
  data: ComboItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateComboDto = {
  name: string;
  comboPrice: number;
  description?: string;
  isAvailable?: boolean;
  components: ComboComponent[]; // sẽ stringify khi gửi
  image: File;                  // swagger đang bắt buộc ảnh khi tạo
};

export type UpdateComboDto = Partial<{
  name: string;
  comboPrice: number;
  description: string;
  isAvailable: boolean;
  components: ComboComponent[]; // nếu truyền -> replace-all
  image: File;                  // optional
}>;

/** ===== Helpers ===== */
function fdCreate(payload: CreateComboDto) {
  const f = new FormData();
  f.set("name", payload.name);
  f.set("comboPrice", String(payload.comboPrice));
  if (payload.description != null) f.set("description", payload.description);
  if (payload.isAvailable != null) f.set("isAvailable", String(payload.isAvailable));
  f.set("components", JSON.stringify(payload.components));
  f.set("image", payload.image);
  return f;
}

function fdUpdate(payload: UpdateComboDto) {
  const f = new FormData();
  if (payload.name != null) f.set("name", payload.name);
  if (payload.comboPrice != null) f.set("comboPrice", String(payload.comboPrice));
  if (payload.description != null) f.set("description", payload.description);
  if (payload.isAvailable != null) f.set("isAvailable", String(payload.isAvailable));
  if (payload.components) f.set("components", JSON.stringify(payload.components));
  if (payload.image) f.set("image", payload.image);
  return f;
}

/** ===== Queries ===== */
export function useCombosQuery(params: { page?: number; limit?: number }) {
  return useQuery<ComboListResp, Error>({
    queryKey: ["combos", params],
    queryFn: async () => {
      const res = await api.get<ComboListResp>("/menucomboitem/list", { params });
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useComboDetailQuery(id?: string) {
  return useQuery<ComboItem, Error>({
    queryKey: ["combo", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ComboItem>(`/menucomboitem/getinfo/${id}`);
      return res.data;
    },
  });
}

/** ===== Mutations ===== */
export function useCreateComboMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateComboDto) => {
      const res = await api.post("/menucomboitem/create", fdCreate(payload), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as ComboItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["combos"] });
    },
  });
}

export function useUpdateComboMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateComboDto }) => {
      const res = await api.patch(`/menucomboitem/${id}`, fdUpdate(data), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as ComboItem;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["combos"] });
      qc.invalidateQueries({ queryKey: ["combo", id] });
    },
  });
}

export function useDeleteComboMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/menucomboitem/delete/${id}`);
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["combos"] });
    },
  });
}
