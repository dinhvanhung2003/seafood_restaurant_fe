// src/hooks/admin/useUom.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export type UomOption = {
  code: string; // "G", "KG", "CAN"
  name: string; // "Gram", "Kilogram"
  conversionToBase: number; // 1, 1000, 24
  isBase: boolean;
  label: string; // "KG (x1000 G)"
};

export function useItemUOMs(itemId?: string) {
  return useQuery({
    enabled: !!itemId,
    queryKey: ["item-uoms", itemId],
    queryFn: async () =>
      (await api.get<UomOption[]>(`/inventoryitems/${itemId}/uoms`)).data,
    staleTime: 5 * 60 * 1000,
  });
}
