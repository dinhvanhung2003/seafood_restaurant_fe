// src/hooks/purchase/usePurchaseReceipts.ts
import { useQuery, useMutation, useQueryClient,keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/axios";

/** ===== Types theo swagger mới ===== */
export type DiscountType = "AMOUNT" | "PERCENT";

export interface PRItemCreate {
  itemId: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  receivedUomCode?: string; // "KG", "BOX", ...
  lotNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  note?: string;
}

export interface PRCreatePayload {
  supplierId: string;
  receiptDate: string; // YYYY-MM-DD
  globalDiscountType: DiscountType;
  globalDiscountValue: number;
  shippingFee: number;
  amountPaid: number;
  note?: string;
  items: PRItemCreate[];
}

export interface PRCreateResponse {
  id: string;
  code: string;
}
export type PRListResp = {
  data: any[];
  total: number;
  page: number;       // 1-based
  limit: number;
  totalPages: number;
};
/** ===== Queries ===== */
export function usePRList(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: ["pr-list", params.page, params.limit],
    queryFn: async (): Promise<PRListResp> => {
      const { data } = await api.get("/purchasereceipt/list", { params }); // BE đang nhận { page, limit }
      return data as PRListResp;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function usePROne(id?: string) {
  return useQuery({
    enabled: !!id,
    queryKey: ["pr-one", id],
    queryFn: async () => (await api.get(`/purchasereceipt/getId/${id}`)).data,
  });
}

export function usePRCreate() {
  const qc = useQueryClient();
  return useMutation<PRCreateResponse, unknown, PRCreatePayload>({
    mutationFn: async (payload) =>
      (await api.post<PRCreateResponse>("/purchasereceipt/create-purreceipt-posted", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pr-list"] });
    },
  });
}

/** Lưu nháp
 * BE bạn đã có method createDraft(); giả định endpoint:
 *   POST /purchasereceipt/create-draft
 * Nếu BE dùng path khác, bạn đổi string bên dưới là xong.
 */
export function usePRCreateDraft() {
  const qc = useQueryClient();
  return useMutation<PRCreateResponse, unknown, PRCreatePayload>({
    mutationFn: async (payload) =>
      (await api.post<PRCreateResponse>("/purchasereceipt/create-purreceipt-draft", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pr-list"] });
    },
  });
}