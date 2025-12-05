// src/hooks/cashier/useReturnInvoiceDetail.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

/* ======================= Types ======================= */

export interface InvoiceReturnItem {
  orderItemId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  soldQty: number;
  returnedQty: number;
  remainQty: number;
}

export interface InvoiceReturnSummary {
  invoice: {
    id: string;
    invoiceNumber: string;
    createdAt: string;
    tableName: string | null;
    customerName: string | null;
    totalAmount: number;
    discountTotal: number;
    finalAmount: number;
  };
  items: InvoiceReturnItem[];
}

/* ======================= Hook ======================= */

/**
 * @param invoiceId  id hóa đơn
 * @param enabled    truyền thêm cờ open từ modal để chỉ fetch khi modal mở
 */
export function useReturnInvoiceDetail(
  invoiceId?: string,
  enabled: boolean = true,
) {
  return useQuery<InvoiceReturnSummary | null>({
    queryKey: ["return-invoice-detail", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const { data } = await api.get(`/returns/invoice/${invoiceId}`);
      return data as InvoiceReturnSummary;
    },
    enabled: enabled && !!invoiceId,
  });
}
