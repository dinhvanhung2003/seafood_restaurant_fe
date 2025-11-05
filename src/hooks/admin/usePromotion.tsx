"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@/lib/axios";

/** ===== Types ===== */
export type Promotion = {
  id: string;
  name: string;
  discountTypePromotion: "PERCENT" | "AMOUNT" | "FIXED" | string;
  discountValue: string; // BE trả string
  maxDiscountAmount?: string | null;
  minOrderAmount?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  applyWith: "ORDER" | "CATEGORY" | "ITEM" | string;
  audienceRules?: {
    scope?: "ALL" | "GROUP" | "MEMBER_TIER" | string;
    daysOfWeek?: number[];
    startTime?: string | null;
    endTime?: string | null;
  } | null;
  promotionCode?: string | null;
  isActive: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  categoryIds?: string[] | null;
  itemIds?: string[] | null;
  categories?: { id: string; name: string }[] | null;
  items?: { id: string; name: string }[] | null;
  isDeleted?: boolean;
};

export type PromotionListResp = {
  code: number;
  success: boolean;
  message: string;
  data: Promotion[];
  meta: { total: number; page: number; limit: number; pages: number };
};

export type PromotionsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: "true" | "false";
  includeDeleted?: boolean;
};

export type PromotionCategory = {
  id: string;
  name: string;
  description?: string | null;
  type?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PromotionItem = {
  id: string;
  name: string;
  price: string; // BE trả string
  description?: string | null;
  image?: string | null;
  isAvailable?: boolean;
  isCombo?: boolean;
};

export type PromotionDetail = Promotion & {
  // từ BE
  stackable?: boolean;
  maxDiscountAmount?: string | null;
  categories?: PromotionCategory[];
  items?: PromotionItem[];
};

type PromotionDetailResp = {
  code: number;
  success: boolean;
  message: string;
  data: PromotionDetail;
};

/** ===== Queries ===== */
export function usePromotionsQuery(params: PromotionsQuery) {
  return useQuery<
    {
      items: Promotion[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    any
  >({
    queryKey: ["promotions", params],
    queryFn: async () => {
      const res = await api.get<PromotionListResp>("/promotions/list-all", {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          includeDeleted: params.includeDeleted ?? false,
          search: params.search || undefined,
          isActive: params.isActive || undefined,
        },
      });

      const items = res.data.data ?? [];
      const m = res.data.meta ?? {
        page: 1,
        limit: 10,
        total: items.length,
        pages: 1,
      };

      return {
        items,
        page: m.page,
        limit: m.limit,
        total: m.total,
        totalPages: m.pages ?? Math.max(1, Math.ceil(m.total / m.limit || 10)),
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** ===== Query detail (trả đúng shape {data}) ===== */
export function usePromotionDetailQuery(id?: string) {
  return useQuery<PromotionDetail, Error>({
    queryKey: ["promotion", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<PromotionDetailResp>(`/promotions/${id}`);
      // BE gói {data}, lấy ra PromotionDetail
      return res.data.data;
    },
  });
}

/** ===== Mutations ===== */
export function usePromotionToggleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/promotions/${id}/activate`, { isActive });
      return res.data as { success: boolean };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotions"] });
    },
  });
}

// payload tối thiểu để tạo/sửa
export type UpsertPromotionDto = {
  name: string;
  discountTypePromotion: "PERCENT" | "AMOUNT" | "FIXED";
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  applyWith: "ORDER" | "CATEGORY" | "ITEM";
  audienceRules?: {
    scope: "ALL" | "GROUP" | "MEMBER_TIER" | string;
    daysOfWeek?: number[];
    startTime?: string | null;
    endTime?: string | null;
  };
  promotionCode: string | null;
  categoryIds?: string[];
  itemIds?: string[];
};

export function useCreatePromotionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertPromotionDto) => {
      const res = await api.post("/promotions/create", payload);
      console.log(res.data);
      return res.data as Promotion;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
}

export function useUpdatePromotionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpsertPromotionDto;
    }) => {
      const res = await api.patch(`/promotions/${id}/update`, data);
      return res.data as Promotion;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["promotions"] });
      qc.invalidateQueries({ queryKey: ["promotion", id] });
    },
  });
}

export function usePromotionSoftDeleteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/promotions/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
}

export function usePromotionRestoreMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/promotions/${id}/restore`, {});
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
}

export type ApplicablePromo = {
  promotionId: string;
  promotionCode: string;
  name: string;
  description?: string;
  applyWith: "ORDER" | "CATEGORY" | "ITEM";
  discountType: "PERCENT" | "AMOUNT";
  discountValue: number;
  maxDiscountAmount: number;
  base: number;
  estimatedDiscount: number;
};

export function useApplicablePromotions(invoiceId?: string | null) {
  return useQuery<ApplicablePromo[]>({
    queryKey: ["applicable-promos", invoiceId],
    enabled: !!invoiceId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!invoiceId) return [];
      const res = await api.get(`/invoices/${invoiceId}/applicable-promotions`);
      const list = Array.isArray(res.data) ? res.data : [];
      return list
        .filter((p: any) => p.applyWith === "ORDER")
        .map((p: any) => ({
          promotionId: p.promotionId,
          promotionCode: p.promotionCode,
          name: p.name,
          description: p.description,
          applyWith: p.applyWith,
          discountType: p.discountType,
          discountValue: Number(p.discountValue ?? 0),
          maxDiscountAmount: Number(p.maxDiscountAmount ?? 0),
          base: Number(p.base ?? 0),
          estimatedDiscount: Number(p.estimatedDiscount ?? 0),
        }))
        .filter((p: ApplicablePromo) => p.estimatedDiscount > 0)
        .sort(
          (a: ApplicablePromo, b: ApplicablePromo) =>
            b.estimatedDiscount - a.estimatedDiscount
        );
    },
  });
}
