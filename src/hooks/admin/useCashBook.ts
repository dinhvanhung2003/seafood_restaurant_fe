"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";



/* ====================== Types ====================== */
export type CashType = {
  id: string;
  name: string;
  description?: string;
  isIncomeType: boolean;
  isActive: boolean;
};

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

export type CreateEntryBody = {
  type: "RECEIPT" | "PAYMENT";
  date: string;                     // YYYY-MM-DD
  cashTypeId: string;
  amount: string;                   // "100000"
  isPostedToBusinessResult?: boolean;
  counterpartyGroup: "CUSTOMER" | "SUPPLIER" | "EMPLOYEE" | "OTHER";
  customerId?: string;
  supplierId?: string;
  employeeId?: string;
  cashOtherPartyId?: string;
  counterpartyName?: string;
  invoiceId?: string;
  purchaseReceiptId?: string;
  sourceCode?: string;
};

export type CashbookResponse<T = any> = {
  data: T[];
  meta: { total: number; page: number; pages: number; limit: number };
};

export type CashbookDetailResponse<T = any> = { data: T };

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




















import { keepPreviousData } from "@tanstack/react-query";
export function useCashbookList(params: Record<string, any>) {
  return useQuery({
    queryKey: ["cashbook", params],
    queryFn: async () => {
      const res = await api.get<CashbookResponse>("/cashbook/list-cashbook", {
        params,
      });
      return res.data;
    },
    placeholderData:keepPreviousData
  });
}
export function useCashbookDetail(id?: string) {
  return useQuery({
    queryKey: ["cashbook-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<CashbookDetailResponse>(`/cashbook/detail-cashbook/${id}`);
      return res.data;
    },
  });
}
/* =================== Cash Types =================== */
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
export function useOtherParties() {
  return useQuery({
    queryKey: CASHBOOK_KEYS.otherParties(),
    queryFn: async (): Promise<OtherParty[]> => {
      const res = await api.get("/cashbook/list-other-party");
      return res.data?.data ?? [];
    },
  });
}

export function useCreateOtherParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      phone?: string;
      address?: string;
      ward?: string;
      district?: string;
      province?: string;
      note?: string;
    }) => {
      const res = await api.post("/cashbook/create-other-party", body);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CASHBOOK_KEYS.otherParties() });
    },
  });
}

/* =================== Create Entry =================== */
export function useCreateCashbookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateEntryBody) => {
      const res = await api.post("/cashbook/create-cashbook", body);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      // Invalidate mọi list/detail liên quan đến cashbook
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && (q.queryKey as QueryKey).includes("cashbook"),
      });
    },
  });
}