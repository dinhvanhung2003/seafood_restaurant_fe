// src/lib/api/orders.ts
import api from '@/lib/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
export async function fetchOpenTables() {
  const res = await api.get('/orders/open-tables');
  return res.data as Array<{ tableId: string; tableName: string }>;
}

export async function fetchOpenOrdersByTable(tableId: string) {
  const res = await api.get('/orders/open-by-table', { params: { tableId } });
  return res.data as Array<{
    id: string; tableId: string; tableName: string;
    itemsCount: number; status: string; createdAt: string; total: number;
  }>;
}

export async function mergeOrder(fromId: string, toOrderId: string) {
  const res = await api.post(`/orders/${fromId}/merge-into`, { toOrderId });
  return res.data;
}



export function useOpenTables() {
  return useQuery({ queryKey: ['open-tables'], queryFn: fetchOpenTables, staleTime: 15_000 });
}

export function useOpenOrdersByTable(tableId?: string) {
  return useQuery({
    queryKey: ['open-orders-by-table', tableId],
    enabled: !!tableId,
    queryFn: () => fetchOpenOrdersByTable(tableId!),
  });
}

// src/lib/api/orders.ts
export function useMergeOrderMutate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fromId, toId }: { fromId: string; toId: string }) => mergeOrder(fromId, toId),
    onSuccess: (_data, vars) => {
      // KHỚP VỚI CÁC HOOK ĐANG DÙNG TRONG MODAL
      qc.invalidateQueries({ queryKey: ["open-order-tables"] });
      qc.invalidateQueries({ queryKey: ["open-orders-in-table"] });

      // Nếu có các màn khác:
      qc.invalidateQueries({ queryKey: ["active-orders"] });
      // qc.invalidateQueries({ queryKey: ["order-detail", vars.fromId] });
      // qc.invalidateQueries({ queryKey: ["order-detail", vars.toId] });
    },
  });
}

