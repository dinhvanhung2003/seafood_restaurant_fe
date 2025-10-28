// src/hooks/cashier/useKitchenHistory.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export type HistoryItem = {
  id: string;
  createdAt: string;
  staff: string;
  tableName: string;
  note: string | null;
  priority: boolean;
  items: { menuItemId: string; name: string; qty: number }[];
};

export function useKitchenHistory(orderId?: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['kitchen-history', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await api.get(`/kitchen/orders/${orderId}/notify-history`);
      return res.data as HistoryItem[];
    },
    staleTime: 15_000,
  });

  // helper để prepend ngay khi vừa báo bếp xong (optimistic UI)
  const prepend = (h: HistoryItem) => {
    qc.setQueryData<HistoryItem[]>(['kitchen-history', orderId], (prev) => [h, ...(prev ?? [])]);
  };

  return { ...q, prepend };
}
