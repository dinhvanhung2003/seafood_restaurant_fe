// ví dụ:
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
export type KitchenVoid = {
  id: string;
  tableName: string;
  itemName: string;
  qty: number;
  createdAt: string; // BE gửi ISO string
  source: 'cashier' | 'waiter' | 'kitchen';
  reason: string | null;
  byName: string | null;
};

export function useKitchenVoids(orderId?: string) {
  // hoặc by table tuỳ bạn
  const q = useQuery({
    queryKey: ['kitchen-voids', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const r = await api.get(`/void-events/by-table/${orderId}`);
      return r.data as KitchenVoid[];
    },
  });

  return {
    kitchenVoids: q.data ?? [],
    ...q,
  };
}
