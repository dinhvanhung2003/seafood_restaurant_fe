// src/hooks/cashier/useReturnInvoices.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

/* ======================= Types ======================= */

export interface ReturnableInvoiceRow {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: number;
  finalAmount: number;
  discountTotal: number;
  tableName: string | null;
  customerName: string | null;
}

export interface ReturnableInvoiceResponse {
  data: ReturnableInvoiceRow[];
  total: number;
  page: number;
  limit: number;
}

/* ======================= Hook ======================= */
export type ReturnableInvoice = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: number;
  finalAmount: number;
  discountTotal: number;
  tableName: string | null;
  customerName: string | null;
};


type Params = {
  search?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
};

export function useReturnInvoices(params: Params) {
  return useQuery<ReturnableInvoiceResponse>({
    queryKey: ["return-invoices", params],
    queryFn: async () => {
      const { data } = await api.get("/returns/invoices", { params });
      return data as ReturnableInvoiceResponse;
    },
   
  });
}
