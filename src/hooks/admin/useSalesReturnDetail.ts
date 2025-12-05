import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export type SalesReturnItemRow = {
  id: string;
  menuItemName: string;
  qty: number;
  unitPrice: number;
  lineAmount: number;
  reason: string | null;
};

export type SalesReturnDetail = {
  id: string;
  returnNumber: string;
  note: string | null;
  refundMethod: string;
  goodsAmount: number;
  discountAmount: number;
  refundAmount: number;
  createdAt: string;

  invoiceId: string | null;
  invoiceNumber: string | null;
  tableName: string | null;

  customerName: string | null;
  cashierName: string | null;

  items: SalesReturnItemRow[];
};

// cho phép truyền thêm `open` để chỉ fetch khi modal mở
export function useSalesReturnDetail(returnId?: string, open?: boolean) {
  return useQuery<SalesReturnDetail>({
    queryKey: ['sales-return-detail', returnId],
    enabled: !!returnId && !!open, // 👈 không chạy query khi chưa có id hoặc modal đang đóng
    queryFn: async () => {
      const res = await api.get<{ data: SalesReturnDetail }>(
        `/returns/${returnId}`,
      );
      return res.data.data;
    },
  });
}
