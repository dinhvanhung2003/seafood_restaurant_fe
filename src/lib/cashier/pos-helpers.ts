// Helpers & lightweight types cho POS
import type { ItemStatus } from "@/types/types";
export type UIOrderItem = {
  id: string;          // menuItemId
  qty: number;
  rowId?: string;      // orderItemId
  status?: ItemStatus; // <-- thêm
};


export type OrdersByTable = Record<string, {
  activeId: string;
  orders: { id: string; label: string; items: UIOrderItem[] }[];
}>;

export const uid = () => Math.random().toString(36).slice(2, 9);

import type { Table as TableType } from "@/types/types";

export function mapAreasToTables(areas: { id:string; name:string; tables:{id:string; name:string; seats:number}[] }[]): TableType[] {
  const acc: TableType[] = [];
  for (const a of areas ?? []) {
    for (const t of a.tables ?? []) {
      acc.push({
        id: t.id,
        name: t.name,
        floor: String(a.name),
        status: "empty",
        seats: t.seats,
        startedAt: undefined,
        currentAmount: 0,
      } as TableType);
    }
  }
  return acc;
}

export function selectMenuItems(rows?: any[]) {
  const list = rows ?? [];
  return list
    .filter((r) => r.isAvailable)
    .map((r) => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      categoryId: r.category.id,
      image: r.image ?? undefined,
    }));
}

export function calcOrderTotal(items: UIOrderItem[], priceDict: Map<string, number>) {
  return items.reduce((s, it) => s + (priceDict.get(it.id) ?? 0) * it.qty, 0);
}
