// hooks/admin/useCombo.ts
"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  getFriendlyMessageFromError,
  mapBackendCodeToVI,
} from "@/lib/errorMap";

/* ================= Types ================= */

// Thành phần hiển thị của 1 combo (dùng cho cả list/detail)
export type ComboComponentView = {
  id: string;
  quantity: string | number;
  item: {
    id: string;
    name: string;
    price: string | number;
    image: string | null;
    isCombo: boolean;
  };
};

export type ComboListItem = {
  id: string;
  name: string;
  price: string | number;
  description: string | null;
  image: string | null;
  isAvailable: boolean;
  isCombo: true;

  // LIST có thể không trả; để optional để UI đọc an toàn
  components?: ComboComponentView[];
};

// Detail luôn có components
export type ComboDetail = Omit<ComboListItem, "components"> & {
  components: ComboComponentView[];
};

export type ComboListResp = {
  data: ComboListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ComboListQuery = { page?: number; limit?: number; search?: string };

export type ComboComponent = { itemId: string; quantity: number };

export type CreateComboDto = {
  name: string;
  comboPrice: number;
  description?: string;
  isAvailable?: boolean;
  components: ComboComponent[];
  image: File;
};
export type UpdateComboDto = Partial<CreateComboDto>;

// Alias để tương thích chỗ gọi cũ (nếu có)
export type ComboItem = ComboListItem;

/* ================= Helpers ================= */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUID = (s?: string): s is string => !!s && UUID_RE.test(s);

const clamp = (n: any, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.floor(Number(n ?? min) || min)));

const errMsg = (e: any) => {
  const d = e?.response?.data;
  return Array.isArray(d?.message)
    ? d.message.join(", ")
    : d?.message || e?.message || "Có lỗi xảy ra";
};

const fdCreate = (p: CreateComboDto) => {
  const f = new FormData();
  f.set("name", p.name);
  f.set("comboPrice", String(p.comboPrice));
  if (p.description != null) f.set("description", p.description);
  if (p.isAvailable != null) f.set("isAvailable", String(p.isAvailable));
  f.set("components", JSON.stringify(p.components));
  f.set("image", p.image);
  return f;
};

const fdUpdate = (p: UpdateComboDto) => {
  const f = new FormData();
  if (p.name != null) f.set("name", p.name);
  if (p.comboPrice != null) f.set("comboPrice", String(p.comboPrice));
  if (p.description != null) f.set("description", p.description);
  if (p.isAvailable != null) f.set("isAvailable", String(p.isAvailable));
  if (p.components) f.set("components", JSON.stringify(p.components));
  if (p.image) f.set("image", p.image);
  return f;
};

/* ================= LIST ================= */
export function useCombosQuery(
  params: ComboListQuery = { page: 1, limit: 10 }
) {
  const page = clamp(params.page, 1, 1e9);
  const limit = clamp(params.limit, 1, 100);
  const search = params.search?.trim() || undefined;

  const q = useQuery<ComboListResp>({
    queryKey: ["combos", { page, limit, search }],
    queryFn: async () => {
      // API hiện trả: { code, success, message, data: [...], meta: {...} }
      const { data: res } = await api.get("/menucomboitem/list", {
        params: { page, limit, search },
      });

      const mapped: ComboListResp = {
        data: res.data as ComboListItem[],
        total: Number(res?.meta?.total ?? 0),
        page: Number(res?.meta?.page ?? page),
        limit: Number(res?.meta?.limit ?? limit),
        totalPages: Number(res?.meta?.pages ?? 1),
      };
      return mapped;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (q.isError) {
      toast.error("Không tải được danh sách combo", {
        description: errMsg(q.error),
        id: "combos-list-error",
      });
    }
  }, [q.isError, q.error]);

  return q;
}

/* ================= DETAIL ================= */
export function useComboDetailQuery(id?: string) {
  const enabled = isUUID(id);

  const q = useQuery<ComboDetail>({
    queryKey: ["combo", id],
    queryFn: async () => {
      const { data } = await api.get<ComboDetail>(
        `/menucomboitem/getinfo/${id}`
      );
      return data; // có components
    },
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (q.isError) {
      toast.error("Không tải được chi tiết combo", {
        description: errMsg(q.error),
        id: "combo-detail-error",
      });
    }
  }, [q.isError, q.error]);

  return q;
}

/* ================= CREATE ================= */
export function useCreateComboMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateComboDto) => {
      const res = await api.post<ComboDetail>(
        "/menucomboitem/create",
        fdCreate(payload),
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data;
    },
    onMutate: () => ({ tid: toast.loading("Đang tạo combo…") }),
    onSuccess: (data, _vars, ctx) => {
      if (ctx?.tid) toast.dismiss(ctx.tid);
      toast.success("Đã tạo combo", { description: `“${data.name}”` });
      qc.invalidateQueries({ queryKey: ["combos"] });
    },
    onError: (e, _v, ctx) => {
      if (ctx?.tid) toast.dismiss(ctx.tid);
      toast.error("Tạo combo thất bại", { description: errMsg(e) });
    },
  });
}

/* ================= UPDATE ================= */
// Hỗ trợ 2 dạng: { id, data } hoặc { args: { id }, data }
type UpdateInputFlexible =
  | { id: string; data: UpdateComboDto }
  | { args: { id: string }; data: UpdateComboDto };

export function useUpdateComboMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateInputFlexible) => {
      const id = ("id" in payload ? payload.id : payload.args?.id) as
        | string
        | undefined;
      if (!id) throw new Error("Thiếu ID combo để cập nhật");
      const data = payload.data;

      if (data.image) {
        const res = await api.patch<ComboDetail>(
          `/menucomboitem/${id}`,
          fdUpdate(data),
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const maybe = (res as any)?.data;
        if (
          maybe &&
          typeof maybe.success !== "undefined" &&
          maybe.success === false
        ) {
          throw { response: { data: maybe } };
        }
        return res.data;
      }
      const res = await api.patch<ComboDetail>(`/menucomboitem/${id}`, data);
      const maybe = (res as any)?.data;
      if (
        maybe &&
        typeof maybe.success !== "undefined" &&
        maybe.success === false
      ) {
        throw { response: { data: maybe } };
      }
      return res.data;
    },
    onMutate: () => ({ tid: toast.loading("Đang lưu combo…") }),
    onSuccess: (data, vars, ctx) => {
      if (ctx?.tid) toast.dismiss(ctx.tid);

      const patched = data.image
        ? {
            ...data,
            image:
              data.image +
              (data.image.includes("?") ? "&" : "?") +
              "v=" +
              Date.now(),
          }
        : data;

      const id = ("id" in vars ? vars.id : vars.args?.id) as string | undefined;
      if (id && isUUID(id)) {
        qc.setQueryData(["combo", id], patched);
      }

      toast.success("Đã cập nhật combo", { description: `“${data.name}”` });
      qc.invalidateQueries({ queryKey: ["combos"] });
    },
    onError: (e, _v, ctx) => {
      if (ctx?.tid) toast.dismiss(ctx.tid);
      qc.invalidateQueries({ queryKey: ["combos"] });
    },
  });
}

/* ================= DELETE ================= */
export function useDeleteComboMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Inspect response body because backend may return codes like COMBO_HIDDEN or COMBO_DELETED
      const res = await api.delete(`/menucomboitem/delete/${id}`);
      const maybe = (res as any)?.data;
      if (
        maybe &&
        typeof maybe.success !== "undefined" &&
        maybe.success === false
      ) {
        // bubble up structured error
        throw { response: { data: maybe } };
      }
      return { id, resData: maybe } as any;
    },
    onMutate: (id) => {
      const tid = toast.loading("Đang xoá combo…");

      // Optimistic: gỡ item khỏi mọi cache list combos
      const entries = qc.getQueryCache().findAll({ queryKey: ["combos"] });
      for (const entry of entries) {
        const key = entry.queryKey;
        const prev = qc.getQueryData<ComboListResp>(key as any);
        if (prev) {
          qc.setQueryData<ComboListResp>(key as any, {
            ...prev,
            data: prev.data.filter((x) => x.id !== id),
            total: Math.max(0, prev.total - 1),
          });
        }
      }
      return { tid };
    },
    onSuccess: (result, _v, ctx) => {
      if (ctx?.tid) toast.dismiss(ctx.tid);
      // result may be { id, resData }
      const resData = result?.resData ?? null;
      // try multiple places where backend may put the code/message
      const codeCandidate =
        resData?.message ??
        resData?.code ??
        resData?.data?.message ??
        resData?.data?.code ??
        null;

      const friendly = mapBackendCodeToVI(codeCandidate);

      if (friendly) {
        // mapped success message
        if (codeCandidate === "COMBO_HIDDEN") {
          toast.success("Đã ẩn combo", { description: friendly });
        } else if (codeCandidate === "COMBO_DELETED") {
          toast.success("Đã xoá combo", { description: friendly });
        } else {
          // generic mapped message
          toast.success("Hoàn tất", { description: friendly });
        }
      } else if (codeCandidate) {
        // backend returned some code/message we don't know → show a readable fallback (but avoid raw machine codes)
        const text =
          typeof codeCandidate === "string" &&
          !/^[A-Z0-9_]+$/.test(codeCandidate)
            ? codeCandidate
            : "Đã xoá combo";
        toast.success("Đã xoá combo", { description: text });
      } else {
        // no candidate → assume deleted
        toast.success("Đã xoá combo");
      }

      qc.invalidateQueries({ queryKey: ["combos"] });
    },
    onError: (e: any, _id, ctx) => {
      if (ctx?.tid) toast.dismiss(ctx.tid);
      const desc = getFriendlyMessageFromError(e);
      toast.error("Xoá combo thất bại", { description: desc });
      qc.invalidateQueries({ queryKey: ["combos"] });
    },
  });
}
