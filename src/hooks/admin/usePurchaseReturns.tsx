"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import {useQueryClient,useMutation} from "@tanstack/react-query";
export type PurchaseReturnStatus = "DRAFT" | "POSTED" | "REFUNDED" | "CANCELLED";

export type SupplierLite = { id: string; name: string };
export type PurchaseReturnDetail = {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  totalGoods: number;
  discount: number;
  totalAfterDiscount: number;
  refundAmount: number;
  status: "DRAFT" | "POSTED" | "REFUNDED" | "CANCELLED";
  note?: string;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
  logs: Array<{
    id: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    refundPrice: number;
    discount: number;
    total: number;
  }>;
};
export type PurchaseReturnRow = {
  id: string;
  code: string;
  supplier: SupplierLite;
  totalGoods: number;
  discount: number;
  totalAfterDiscount: number;
  refundAmount: number;
  paidAmount: number;
  status: PurchaseReturnStatus;
  note?: string | null;
  createdAt: string; // ISO +07:00
  updatedAt: string;
};

export type PurchaseReturnList = {
  data: PurchaseReturnRow[];
  meta: { total: number; page: number; limit: number; pages: number };
};

function toNumber(n: any) {
  if (typeof n === "number") return n;
  if (typeof n === "string") return parseFloat(n);
  return 0;
}
export function usePurchaseReturnDetail(id?: string, enabled = true) {
  return useQuery<PurchaseReturnDetail>({
    queryKey: ["purchase-return-detail", id],
    enabled: !!id && enabled,
    queryFn: async () => {
      const { data } = await api.get(`/purchasereturn/get/${id}`);
      return data;
    },
    staleTime: 30_000,
  });
}
export function usePurchaseReturns(params: {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: PurchaseReturnStatus | "";
  sortBy?: "createdAt" | "name" | "code";
  sortOrder?: "ASC" | "DESC";
}) {
  const {
    page = 1,
    limit = 20,
    supplierId,
    status,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = params;

  return useQuery<PurchaseReturnList>({
    queryKey: ["purchasereturns", { page, limit, supplierId, status, sortBy, sortOrder }],
    queryFn: async () => {
      const res = await api.get("/purchasereturn/get-all-purchasereturns", {
        params: {
          page,
          limit,
          supplierId,
          status: status || undefined,
          sortBy,
          sortOrder,
        },
      });

      // Chuẩn hoá số dạng string từ BE
      const raw = res.data as PurchaseReturnList;
      const data = (raw?.data ?? []).map((r: any) => ({
        ...r,
        totalGoods: toNumber(r.totalGoods),
        discount: toNumber(r.discount),
        totalAfterDiscount: toNumber(r.totalAfterDiscount),
        refundAmount: toNumber(r.refundAmount),
        paidAmount: toNumber(r.paidAmount),
      }));
      return { data, meta: raw.meta };
    },
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
// ====== DTO ======
export type PurchaseReturnCreateLine = {
  itemId: string;
  quantity: number;
  unitPrice: number;
  receivedUomCode?: string; // ví dụ "KG"
};

export type PurchaseReturnCreateBody = {
  supplierId: string;
  items: PurchaseReturnCreateLine[];
  reason: string;
  discountType?: "AMOUNT" | "PERCENT";
  discountValue?: number;
  paidAmount?: number; // với standalone = số tiền NCC hoàn ngay
};

// ====== CREATE (POSTED ngay) ======
export function useCreatePurchaseReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PurchaseReturnCreateBody) => {
      const { data } = await api.post("/purchasereturn/create-standalone", body);
      return data;
    },
    onSuccess: () => {
      toast.success("Tạo phiếu trả hàng (POSTED) thành công");
      qc.invalidateQueries({ queryKey: ["purchase-returns"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Tạo phiếu trả hàng thất bại");
    },
  });
}

// ====== CREATE DRAFT ======
export function useCreatePurchaseReturnDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PurchaseReturnCreateBody) => {
      const { data } = await api.post("/purchasereturn/create-draft", body);
      return data;
    },
    onSuccess: () => {
      toast.success("Lưu phiếu trả hàng NHÁP thành công");
      qc.invalidateQueries({ queryKey: ["purchase-returns"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Lưu nháp thất bại");
    },
  });
}