// src/hooks/admin/useSalesReturns.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export type SalesReturnRow = {
  id: string;
  returnNumber: string;
  createdAt: string;
  status: string;
  refundMethod: "CASH" | "BANK_TRANSFER" | "CARD" | string;
  goodsAmount: number;
  discountAmount: number;
  refundAmount: number;

  // thông tin liên quan
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  customerName?: string | null;
  cashierName?: string | null;
};

export type SalesReturnListResponse = {
  data: SalesReturnRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SalesReturnListParams = {
  search?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
};

export function useSalesReturns(params: SalesReturnListParams) {
  return useQuery({
    queryKey: ["sales-returns", params],
    queryFn: async () => {
      const { data } = await api.get<SalesReturnListResponse>("/returns", {
        params,
      });
      return data;
    },
   
  });
}
