// src/hooks/cashier/useOpenOrders.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export type OpenOrderTable = {
  tableId: string;
  tableName: string;
  floor?: string | null;
  orderCount: number;
  totalAmount: number;
};

export type TargetOrderSummary = {
  orderId: string;
  tableId?: string;
  tableName?: string;
  customerName?: string | null;
  itemsCount: number;
  totalAmount: number;   // tổng tiền một đơn
  orderCode: string;     // ví dụ: "Bàn 10- c45f"
};

export function useOpenOrderTables() {
  return useQuery({
    queryKey: ["open-tables"],
    queryFn: async () => {
      const res = await api.get("/orders/open-tables");
      const rows = res.data as Array<{
        tableId: string;
        tableName: string;
        orderCount: number;
        totalAmount: number;
      }>;
      return rows;
    },
    staleTime: 15_000,
  });
}

export function useOpenOrdersInTable(
  tableId?: string,
  opts?: { excludeOrderId?: string },
) {
  return useQuery({
    enabled: !!tableId,
    queryKey: ["open-in-table", { tableId, excludeOrderId: opts?.excludeOrderId }],
    queryFn: async () => {
      const res = await api.get("/orders/open-in-table", {
        params: { tableId, excludeOrderId: opts?.excludeOrderId },
      });

      const rows = res.data as Array<{
        id: string;
        tableName?: string;
        customerName?: string | null;
        itemsCount?: number;
        total?: number | string | null;
        createdAt?: string;
      }>;

      return rows.map((r) => {
        const tableName = r.tableName ?? "";
        const shortTable =
          tableName.split(" ").pop() || tableName || "Bàn";
        const totalAmount = Number(r.total ?? 0);

        return {
          orderId: r.id,
          tableName,
          customerName: r.customerName ?? null,
          itemsCount: r.itemsCount ?? 0,
          totalAmount,
          orderCode: `${shortTable}-${r.id.slice(0, 4)}`,
        } as TargetOrderSummary;
      });
    },
    staleTime: 15_000,
  });
}
