// src/hooks/admin/useInvoice.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/axios";

/* ===============================
 *  Types
 * =============================== */

export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID";

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  status: InvoiceStatus;
  // optional area on invoice (some responses include direct area)
  area?: { id: string; name: string } | null;
  table: {
    id: string;
    name: string;
    area?: { id: string; name: string };
  } | null;
  customer: { id: string; name: string } | null;
  guestCount: number | null;
  totalAmount: number;
  discountTotal: number;
  finalAmount: number;
  paidCash: number;
  paidBank: number;
  paidTotal: number;
  remaining: number;
};

export type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  status: InvoiceStatus;
  table: { id: string; name: string } | null;
  customer: { id: string; name: string; phone?: string } | null;
  guestCount: number | null;
  items: {
    id: string;
    menuItemId: string;
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  payments: {
    id: string;
    method: "CASH" | "VNPAY" | "PAYOS";
    status: string;
    amount: number;
    txnRef?: string;
    createdAt: string;
  }[];
  totalAmount: number;
  discountTotal: number;
  finalAmount: number;
  paidCash: number;
  paidBank: number;
  paidTotal: number;
  remaining: number;
};

/* ===============================
 *  List Query
 * =============================== */

type ListResponse = {
  items: InvoiceListItem[];
  meta?: { total: number; page: number; limit: number; pages: number };
  raw?: any;
};

/**
 * Lấy danh sách hóa đơn (dùng trong trang admin → giao dịch → hóa đơn)
 */
export function useInvoices(params: {
  q?: string;
  status?: InvoiceStatus;
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: string;
  tableId?: string;
  areaId?: string;
}) {
  const {
    q = "",
    status,
    page = 1,
    limit = 20,
    fromDate,
    toDate,
    paymentMethod,
    tableId,
    areaId,
  } = params;

  return useQuery<ListResponse>({
    queryKey: [
      "invoices",
      {
        q,
        status,
        page,
        limit,
        fromDate,
        toDate,
        paymentMethod,
        tableId,
        areaId,
      },
    ],
    queryFn: async () => {
      const queryParams: Record<string, any> = {
        q: q?.trim() || undefined,
        page,
        limit,
      };
      if (status) queryParams.status = status;
      if (fromDate) queryParams.fromDate = fromDate;
      if (toDate) queryParams.toDate = toDate;
      if (paymentMethod) queryParams.paymentMethod = paymentMethod;
      if (tableId) queryParams.tableId = tableId;
      if (areaId) queryParams.areaId = areaId;

      const { data } = await api.get("/invoices", { params: queryParams });

      // BE trả dạng { code, success, message, data: [...], meta: {...} }
      const items = data?.data ?? data?.items ?? [];
      const meta = data?.meta ?? undefined;
      return { items, meta, raw: data };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/* ===============================
 *  Detail Query
 * =============================== */

/**
 * Lấy chi tiết 1 hóa đơn
 */
export function useInvoiceDetail(id?: string, options?: { enabled?: boolean }) {
  const enabled = !!id && (options?.enabled ?? true);

  return useQuery<InvoiceDetail>({
    queryKey: ["invoice", id],
    enabled,
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${id}`);
      // BE trả { code, success, message, data: {...} }
      return data?.data ?? data;
    },
  });
}
