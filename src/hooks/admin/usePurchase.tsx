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
      (
        await api.post<PRCreateResponse>(
          "/purchasereceipt/create-purreceipt-posted",
          payload
        )
      ).data,
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
      (
        await api.post<PRCreateResponse>(
          "/purchasereceipt/create-purreceipt-draft",
          payload
        )
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pr-list"] });
    },
  });
}

// bổ sung type cho update (thực chất same create, chỉ thêm status/updatedBy optional)
export interface PRUpdatePayload extends PRCreatePayload {}

// ---- UPDATE Draft PUT /purchasereceipt/update/:id?postNow=... ----
export function usePRUpdateDraftOrPost() {
  const qc = useQueryClient();
  return useMutation<
    any,
    unknown,
    { id: string; postNow: boolean | string; payload: PRUpdatePayload }
  >({
    mutationFn: async ({ id, postNow, payload }) =>
      (
        await api.put(`/purchasereceipt/update-draft-or-post/${id}`, payload, {
          params: { postNow },
        })
      ).data,
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["pr-list"] });
      qc.invalidateQueries({ queryKey: ["pr-one", vars.id] });
    },
  });
}

// ===== Pay Receipt (trả nợ NCC) =====
export interface PRPayPayload {
  id: string;           // id phiếu nhập
  addAmountPaid: number; // số tiền TRẢ THÊM lần này
}

export interface PRPayResponse {
  id: string;
  status: string;       // PAID / OWING
  amountPaid: number;   // tổng đã trả sau lần này
  grandTotal: number;   // tổng tiền hóa đơn
  remaining: number;    // còn phải trả
  paidInFull: boolean;  // true = đã trả hết
}
export function usePRPayReceipt() {
  const qc = useQueryClient();
  return useMutation<PRPayResponse, unknown, PRPayPayload>({
    mutationFn: async ({ id, addAmountPaid }) => {
      const { data } = await api.post<PRPayResponse>(
        `/purchasereceipt/${id}/pay`,  
        { addAmountPaid },             
      );
      return data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["pr-list"] });
      qc.invalidateQueries({ queryKey: ["pr-one", vars.id] });
    },
  });
}

