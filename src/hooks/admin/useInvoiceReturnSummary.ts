import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export type InvoiceReturnItem = {
  orderItemId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  soldQty: number;
  returnedQty: number;
  remainQty: number;
};

export type InvoiceReturnSummary = {
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
};

export function useInvoiceReturnSummary(invoiceId?: string, open?: boolean) {
  return useQuery<InvoiceReturnSummary>({
    queryKey: ["invoice-return-summary", invoiceId],
    enabled: !!invoiceId && !!open, // 👈 không fetch khi chưa có id hoặc modal đóng
    queryFn: async () => {
      const res = await api.get(`/returns/invoice/${invoiceId}`);

      // BE có thể trả { data: {...} } hoặc {...}
      const raw = (res.data as any)?.data ?? (res.data as any);

      if (!raw) {
        // đừng return undefined → ném lỗi rõ ràng
        throw new Error("EMPTY_INVOICE_RETURN_SUMMARY");
      }

      return {
        invoice: raw.invoice,
        items: raw.items ?? [],
      } as InvoiceReturnSummary;
    },
  });
}
