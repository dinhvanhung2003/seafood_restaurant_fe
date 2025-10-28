// src/hooks/cashier/useSplitOrder.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

type SplitPayload =
  | { mode: "create-new"; tableId: string; items: Array<{ itemId: string; quantity: number }> }
  | { mode: "to-existing"; toOrderId: string; items: Array<{ itemId: string; quantity: number }> };

export function useSplitOrderMutate(fromOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SplitPayload) =>
      api.post(`/orders/${fromOrderId}/split`, payload).then((r) => r.data),
    onSuccess: (_data) => {
      // làm mới các list liên quan
      qc.invalidateQueries({ queryKey: ["open-tables"] });
      qc.invalidateQueries({ queryKey: ["open-in-table"] });
      qc.invalidateQueries({ queryKey: ["order-detail", fromOrderId] });
    },
  });
}
