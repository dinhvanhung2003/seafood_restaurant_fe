"use client";

import { useQuery, useMutation, useQueryClient, QueryKey, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  CashbookItem,
  CashbookResponse,
  CashbookDetailResponse,
  CashbookSummary,
} from "@/types/admin/cashbook";

/* =================== Query Keys ==================== */
export const CASHBOOK_KEYS = {
  list: (params?: Record<string, any>) => ["cashbook", "list", params] as const,
  detail: (id?: string) => ["cashbook", "detail", id] as const,
  types: () => ["cashbook", "types"] as const,
  otherParties: () => ["cashbook", "other-parties"] as const,
  createEntry: () => ["cashbook", "create-entry"] as const,
  createType: () => ["cashbook", "create-type"] as const,
  createOtherParty: () => ["cashbook", "create-other-party"] as const,
};

/* =================== List ==================== */
/**
 * Chuẩn hoá để hỗ trợ 2 dạng payload từ BE:
 *  A) { code, success, data: { items: CashbookItem[], meta, summary? } }
 *  B) { code, success, data: CashbookItem[], meta }
 * Trả ra object thống nhất: { data: CashbookItem[], meta, summary? }
 */
export function useCashbookList(params: Record<string, any>) {
  return useQuery({
    queryKey: CASHBOOK_KEYS.list(params),
    queryFn: async (): Promise<{ data: CashbookItem[]; meta: CashbookResponse["meta"]; summary?: CashbookSummary }> => {
      const res = await api.get("/cashbook/list-cashbook", { params });

      // raw có thể là A hoặc B
      const raw = res.data;
      const hasNested = raw?.data && typeof raw.data === "object" && Array.isArray(raw.data.items);
      const items: CashbookItem[] = hasNested ? raw.data.items : raw?.data ?? [];
      const meta = hasNested ? raw.data.meta : raw?.meta ?? { total: 0, page: 1, limit: params?.limit ?? 15, pages: 1 };
      const summary: CashbookSummary | undefined = hasNested ? raw.data.summary : undefined;

      // đảm bảo luôn trả array để tránh rows.map lỗi
      return {
        data: Array.isArray(items) ? items : [],
        meta,
        summary,
      };
    },
    placeholderData: keepPreviousData,
  });
}

/* =================== Detail ==================== */
export function useCashbookDetail(id?: string) {
  return useQuery({
    queryKey: CASHBOOK_KEYS.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<CashbookDetailResponse["data"]> => {
      const res = await api.get<CashbookDetailResponse>(`/cashbook/detail-cashbook/${id}`);
      return res.data.data;
    },
  });
}

/* =================== Cash Types =================== */
export type CashType = {
  id: string;
  name: string;
  description?: string | null;
  isIncomeType: boolean;
  isActive: boolean;
};

export function useCashTypes() {
  return useQuery({
    queryKey: CASHBOOK_KEYS.types(),
    queryFn: async (): Promise<CashType[]> => {
      const res = await api.get("/cashbook/cash-types");
      return res.data?.data ?? [];
    },
  });
}

export function useCreateCashType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      description?: string;
      isIncomeType: boolean;
      isActive?: boolean;
    }) => {
      const res = await api.post("/cashbook/cash-types", body);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CASHBOOK_KEYS.types() });
    },
  });
}

/* =================== Other Parties =================== */
export type OtherParty = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  ward?: string;
  district?: string;
  province?: string;
  note?: string;
};

export function useOtherParties() {
  return useQuery({
    queryKey: CASHBOOK_KEYS.otherParties(),
    queryFn: async (): Promise<OtherParty[]> => {
      const res = await api.get("/cashbook/list-other-party");
      return res.data?.data ?? [];
    },
  });
}

export type CreateOtherPartyInput = Omit<OtherParty, "id">;

export function useCreateOtherParty() {
  const qc = useQueryClient();
  return useMutation<OtherParty, unknown, CreateOtherPartyInput>({
    mutationFn: async (body) => {
      const res = await api.post("/cashbook/create-other-party", body);
      // server trả về OtherParty (có id)
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CASHBOOK_KEYS.otherParties() });
    },
  });
}

/* =================== Create Entry =================== */
export type CreateEntryBody = {
  type: "RECEIPT" | "PAYMENT";
  date: string; // ISO hoặc YYYY-MM-DD
  cashTypeId: string;
  amount: string; // giữ string
  isPostedToBusinessResult?: boolean;

  counterpartyGroup: "CUSTOMER" | "SUPPLIER" | "STAFF" | "DELIVERY_PARTNER" | "OTHER";

  customerId?: string;
  supplierId?: string;
  staffId?: string;           // đổi employeeId -> staffId
  deliveryPartnerId?: string; // thêm mới

  cashOtherPartyId?: string;
  counterpartyName?: string;

  invoiceId?: string;
  purchaseReceiptId?: string;
  sourceCode?: string;
};

export function useCreateCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateEntryBody) => {
      const res = await api.post("/cashbook/create-cashbook", body);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey as QueryKey).includes("cashbook"),
      });
    },
  });

}

export function useDeleteCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // API endpoint xóa
      const res = await api.delete(`/cashbook/${id}`);
      return res.data;
    },
    onSuccess: () => {
      // Refresh lại list sau khi xóa thành công
      qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey as QueryKey).includes("cashbook"),
      });
    },
  });
}

/* =================== Update Entry =================== */
export function useUpdateCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { amount?: number; note?: string; date?: string } }) => {
      const res = await api.patch(`/cashbook/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey as QueryKey).includes("cashbook"),
      });
    },
  });
}
