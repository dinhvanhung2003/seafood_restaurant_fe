"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type Uom = {
    code: string;
    name: string;
    factor: number;
};

export type UomOption = {
    code: string; // "G", "KG", "CAN"
    name: string; // "Gram", "Kilogram"
    conversionToBase: number; // 1, 1000, 24
    isBase: boolean;
    label: string; // "KG (x1000 G)"
};

export function useItemUOMs(itemId?: string) {
    return useQuery<UomOption[], Error>({
        enabled: !!itemId,
        queryKey: ["item-uoms", itemId],
        queryFn: async () => (await api.get<UomOption[]>(`/inventoryitems/${itemId}/uoms`)).data,
        staleTime: 5 * 60 * 1000
    });
}

async function getUomsByInventoryItem(itemId: string): Promise<Uom[]> {
    if (!itemId) return [];
    try {
        const res = await api.get(`/units-of-measure/find-by-inventory-item/${itemId}`);
        return res.data?.data ?? res.data ?? [];
    } catch (error) {
        console.error(`Failed to fetch UOMs for item ${itemId}:`, error);
        return [];
    }
}

export function useUom(inventoryItemId: string) {
    return useQuery<Uom[], Error>({
        queryKey: ["uoms", inventoryItemId],
        queryFn: () => getUomsByInventoryItem(inventoryItemId),
        enabled: !!inventoryItemId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}
