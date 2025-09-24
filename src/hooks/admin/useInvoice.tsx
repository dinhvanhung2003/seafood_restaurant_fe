// src/features/invoices/api.ts
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/axios';

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  table: { id: string; name: string } | null;
  customer: { id: string; name: string } | null;
  guestCount: number | null;
  totalAmount: number;
  paidCash: number;
  paidBank: number;
  paidTotal: number;
  remaining: number;
};

export type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID";

export function useInvoices(params: {
  q?: string;
  status: InvoiceStatus;    
  page?: number;
  limit?: number;
}) {
  const { q = "", status, page = 1, limit = 20 } = params;

  const queryParams = {
    q: q?.trim() || undefined,
    status,                   // luôn là UNPAID | PARTIAL | PAID
    page,
    limit,
  };

  return useQuery({
    queryKey: ["invoices", queryParams],
    queryFn: async () => {
      const { data } = await api.get("/invoices", { params: queryParams });
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
export type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  status: string;
  table: { id: string; name: string } | null;
  customer: { id: string; name: string; phone?: string } | null;
  guestCount: number | null;
  items: { id: string; menuItemId: string; name: string; qty: number; unitPrice: number; lineTotal: number }[];
  payments: { id: string; method: 'CASH' | 'VNPAY'; status: string; amount: number; txnRef?: string; createdAt: string }[];
  totalAmount: number;
  paidCash: number;
  paidBank: number;
  paidTotal: number;
  remaining: number;
};

export function useInvoiceDetail(
  id?: string,
  options?: { enabled?: boolean }
) {
  const enabled = !!id && (options?.enabled ?? true);

  return useQuery({
    queryKey: ["invoice", id],
    enabled,
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${id}`);
      return data;
    },
  });
}
