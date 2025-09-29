// src/hooks/purchase/usePurchaseReceipts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

/** ===== Queries ===== */
export function usePRList(params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["pr-list", params],
    queryFn: async () =>
      (await api.get("/purchasereceipt/list", { params })).data,
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
