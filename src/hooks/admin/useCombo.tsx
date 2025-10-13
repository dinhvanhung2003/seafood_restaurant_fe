// hooks/useCombo.ts
"use client";

import { createRestHooks } from "@/hooks/admin/rq";

/* ========= Types ========= */
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
  components: ComboComponent[];
  image: File;
};

export type UpdateComboDto = Partial<CreateComboDto>;

/* ========= Helpers ========= */
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

/** UUID validator (v1–v5) */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUID = (s?: string): s is string => !!s && UUID_RE.test(s);

/* ========= Factory ========= */
const combo = createRestHooks<
  ComboListResp,
  ComboItem,
  { page?: number; limit?: number },
  CreateComboDto,
  UpdateComboDto
>({
  key: "combos",
  list:   { path: "/menucomboitem/list" },
  detail: { path: ({ id }: { id: string }) => `/menucomboitem/getinfo/${id}` },
  create: {
    path: "/menucomboitem/create",
    method: "post",
    mapPayload: fdCreate,
  },
  update: {
    path: ({ id }: { id: string }) => `/menucomboitem/${id}`,
    method: "patch",
    mapPayload: fdUpdate,
  },
  remove: { path: ({ id }: { id: string }) => `/menucomboitem/delete/${id}`, method: "delete" },
});

/* ========= Re-exports =========
   LƯU Ý: KHÔNG export combo.useDetailQuery trực tiếp.
   Thay vào đó bọc lại để:
   - chỉ fetch khi id là UUID hợp lệ
   - truyền đúng shape { args: { id } }
*/
export const {
  useListQuery: useCombosQuery,
  useCreateMutation: useCreateComboMutation,
  useUpdateMutation: useUpdateComboMutation,
  useRemoveMutation: useDeleteComboMutation,
} = combo;


export function useComboDetailQuery(id?: string, options?: any) {
  const ok = isUUID(id);
  if (!ok) {
    // stub cùng shape cơ bản của react-query result để component dùng an toàn
    return {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      error: null,
      refetch: async () => undefined,
    } as any;
  }
  return (combo as any).useDetailQuery({ args: { id } }, options);
}
