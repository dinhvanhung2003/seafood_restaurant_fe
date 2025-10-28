// src/hooks/cashier/useOpenOrdersByTable.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export type OpenOrderRow = {
  tableId: string;
  tableName: string;
  orders: Array<{ id: string; code: string; itemCount: number; total: number }>;
};

export function useOpenOrdersByTable(params: {
  excludeOrderId?: string;     // bỏ qua chính đơn đang mở
  excludeTableId?: string;     // bỏ qua bàn hiện tại
  enabled?: boolean;
}) {
  const { excludeOrderId, excludeTableId, enabled = true } = params;

  const query = useQuery({
    queryKey: ["open-orders-by-table", { excludeOrderId, excludeTableId }],
    queryFn: async () => {
      const res = await api.get<OpenOrderRow[]>("/orders/open-by-table", {
        params: { excludeOrderId, excludeTableId },
      });
      return res.data ?? [];
    },
    enabled,
    staleTime: 15_000,
  });

  // options cho <Select>
  const options = (query.data ?? []).map((r) => ({
    value: r.tableId,
    label: r.tableName,
    orders: r.orders, // giữ lại để render bảng bên dưới
  }));

  return { ...query, options };
}
