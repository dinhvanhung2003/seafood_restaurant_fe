// src/lib/cashier/pos-helpers.ts
import type { ItemStatus } from "@/types/types";

export type CustomerLite = {
  id: string;
  name: string;
  phone?: string | null;
};

export type UIOrderItem = {
  id: string;          // menuItemId
  qty: number;
  rowId?: string;      // orderItemId
  status?: ItemStatus;
  createAt?: string;
  name?: string;
  price?: number;
  image?: string;
};

// 🔹 Tab của 1 order (meta nằm ở đây)
export type UIOrderTab = {
  id: string;
  label: string;
  items: UIOrderItem[];

  guestCount?: number | null;
  customer?: CustomerLite | null;
};

export type OrdersByTable = Record<
  string, // tableId
  { activeId: string; orders: UIOrderTab[] }
>;


export const uid = () => Math.random().toString(36).slice(2, 9);

import type { Table as TableType } from "@/types/types";

export function mapAreasToTables(
  areas: { id: string; name: string; tables?: { id: string; name: string; seats?: number }[] }[] = []
): TableType[] {
  const acc: TableType[] = [];
  for (const a of areas ?? []) {
    for (const t of a?.tables ?? []) {
      acc.push({
        id: String(t.id),
        name: String(t.name),
        floor: String(a?.name ?? ""),
        status: "empty",
        seats: Number(t?.seats ?? 0),
        startedAt: undefined,
        currentAmount: 0,
      } as TableType);
    }
  }
  return acc;
}

/**
 * Chuẩn hoá danh sách món từ nhiều shape khác nhau của BE.
 * Hỗ trợ:
 * - { id, name, price, category: { id }, image }
 * - { id, name, price, categoryId, imageUrl }
 * - { ... , isAvailable } (nếu không có thì mặc định là true)
 */
// export function selectMenuItems(rows?: any[]) {
//   const list = Array.isArray(rows) ? rows : [];

//   return list
//     // chỉ loại khi BE trả rõ ràng false
//     .filter((r) => r?.isAvailable !== false)
//     .map((r) => {
//       const id = String(r?.id ?? "");
//       const name = String(r?.name ?? "");
//       const price = Number(r?.price ?? r?.menuPrice ?? 0);

//       // an toàn khi category null/undefined
//       const categoryId =
//         r?.category?.id ??
//         r?.categoryId ??
//         r?.category?.ID ??
//         r?.category_id ??
//         null;

//       const image =
//         r?.image ??
//         r?.imageUrl ??
//         r?.thumbnail ??
//         undefined;

//       return { id, name, price, categoryId, image };
//     })
//     // lọc các item thiếu id/name tối thiểu để tránh crash ở nơi khác
//     .filter((x) => x.id && x.name);
// }

export function selectMenuItems(rows?: any[]) {
  const list = Array.isArray(rows) ? rows : [];

  return list
    .filter((r) => r?.isAvailable !== false)
    .map((r) => {
      const id = String(r?.id ?? "");
      const name = String(r?.name ?? "");
      const price = Number(r?.price ?? r?.menuPrice ?? 0);

      const categoryId =
        r?.category?.id ??
        r?.categoryId ??
        r?.category?.ID ??
        r?.category_id ??
        null;

      const image =
        r?.image ?? r?.imageUrl ?? r?.thumbnail ?? undefined;
      // Nhận thêm các trường khuyến mãi nếu có
      const priceAfterDiscount = Number(r?.priceAfterDiscount ?? NaN);
      const discountAmount = Number(r?.discountAmount ?? 0);
      const badge = r?.badge ?? null;

      return {
        id, name, categoryId, image,
        price,
        priceAfterDiscount: Number.isFinite(priceAfterDiscount) ? priceAfterDiscount : undefined,
        discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
        badge: typeof badge === "string" ? badge : null,
      };
    })
    .filter((x) => x.id && x.name);
}


export function calcOrderTotal(items: UIOrderItem[], priceDict: Map<string, number>) {
  return (items ?? []).reduce((s, it) => s + (priceDict.get(it.id) ?? 0) * (it.qty ?? 0), 0);
}
