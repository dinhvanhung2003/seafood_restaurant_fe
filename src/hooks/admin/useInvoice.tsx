// src/features/invoices/api.ts
import { useQuery } from '@tanstack/react-query';
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

export function useInvoices(params: {
  q?: string; status?: string; fromDate?: string; toDate?: string;
  page?: number; limit?: number;
}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const { data } = await api.get('/invoices', { params });
      return data as { items: InvoiceListItem[]; total: number; page: number; limit: number; totalPages: number };
    },
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

export function useInvoiceDetail(id?: string) {
  return useQuery({
    enabled: !!id,
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${id}`);
      return data as InvoiceDetail;
    },
  });
}
