"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
export type PurchaseReturnStatus =
  | "DRAFT"
  | "POSTED"
  | "REFUNDED"
  | "CANCELLED";

export type SupplierLite = { id: string; name: string };
export type PurchaseReturnDetail = {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  // optional creator info returned by backend
  creatorId?: string;
  creatorName?: string;
  totalGoods: number;
  discount: number;
  totalAfterDiscount: number;
  refundAmount: number;
  status: "DRAFT" | "POSTED" | "REFUNDED" | "CANCELLED";
  note?: string;
  paidAmount: number;
  discountType?: "AMOUNT" | "PERCENT";
  discountValue?: number;
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
    // possible UOM fields returned by backend
    uomCode?: string;
    uomName?: string;
    receivedUomCode?: string;
    unit?: string;
    unitCode?: string;
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
    limit = 10,
    supplierId,
    status,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = params;

  return useQuery<PurchaseReturnList>({
    queryKey: [
      "purchasereturns",
      { page, limit, supplierId, status, sortBy, sortOrder },
    ],
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
      const { data } = await api.post(
        "/purchasereturn/create-standalone",
        body
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Tạo phiếu trả hàng (POSTED) thành công");
      // invalidate the actual list query key so UI lists refresh
      qc.invalidateQueries({ queryKey: ["purchasereturns"] });
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
      // invalidate the actual list query key so UI lists refresh
      qc.invalidateQueries({ queryKey: ["purchasereturns"] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Lưu nháp thất bại");
    },
  });
}

// ====== UPDATE DRAFT ======
export type PurchaseReturnUpdateBody = PurchaseReturnCreateBody & {
  id: string;
};

// ====== UPDATE (SỬA PHIẾU) ======
export function useUpdatePurchaseReturn() {
  const qc = useQueryClient();
  return useMutation({
    // Sử dụng PATCH/PUT để cập nhật, giả định backend dùng ID trong URL
    mutationFn: async ({ id, ...body }: PurchaseReturnUpdateBody) => {
      // Giả định backend có endpoint update chung cho cả POSTED/DRAFT
      // Hoặc bạn có thể dùng 2 endpoint khác nhau nếu BE yêu cầu
      const { data } = await api.patch(`/purchasereturn/${id}`, body);
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Cập nhật phiếu ${variables.id} thành công.`);
      // Invalidate cả list và chi tiết của phiếu đang sửa
      qc.invalidateQueries({ queryKey: ["purchasereturns"] });
      qc.invalidateQueries({
        queryKey: ["purchase-return-detail", variables.id],
      });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Cập nhật thất bại");
    },
  });
}

export function useChangeStatusPurchaseReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: PurchaseReturnStatus;
    }) => {
      const { data } = await api.patch(`/purchasereturn/${id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Đã chuyển trạng thái phiếu sang ${variables.status}`);
      qc.invalidateQueries({ queryKey: ["purchasereturns"] });
      qc.invalidateQueries({
        queryKey: ["purchase-return-detail", variables.id],
      });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Chuyển trạng thái thất bại");
    },
  });
}

export function usePurchaseReturnPay() {
  const qc = useQueryClient();

  return useMutation<
    any,
    unknown,
    { id: string; paidAmount: number; refundAmount?: number }
  >({
    mutationFn: async ({ id, paidAmount, refundAmount }) => {
      // BE update() đang nằm trong PurchasereturnService
      // Controller nên là PATCH /purchasereturn/:id
      const { data } = await api.patch(`/purchasereturn/${id}`, {
        // gửi paidAmount mới (TỔNG đã trả), không phải “trả thêm”
        paidAmount,
        // nếu muốn cho phép chỉnh luôn refundAmount thì gửi thêm
        ...(refundAmount !== undefined ? { refundAmount } : {}),
      });
      return data;
    },
    onSuccess: (_res, vars) => {
      // reload list + chi tiết
      qc.invalidateQueries({ queryKey: ["purchase-returns"] });
      qc.invalidateQueries({
        queryKey: ["purchase-return-detail", vars.id],
      });
    },
  });
}
