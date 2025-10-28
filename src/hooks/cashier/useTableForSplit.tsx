// src/hooks/cashier/useTablesForSplit.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useTablesWithOpenOrders() {
  return useQuery({
    queryKey: ["tables-with-open"],
    queryFn: async () => (await api.get("/orders/open-tables")).data as Array<{ tableId: string; tableName: string }>
  });
}

export function useTablesWithoutOpenOrders(excludeTableId?: string) {
  return useQuery({
    queryKey: ["tables-without-open", { excludeTableId }],
    queryFn: async () => (await api.get("/orders/tables/without-open-orders", { params: { excludeTableId } })).data as Array<{ id: string; name: string }>
  });
}
