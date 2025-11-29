// services/orders.ts
import { api } from "@/lib/axios";

export type ApiOrderItemRow = {
  id: string;                 // orderItem id (cần cho remove)
  menuItemId: string;
  quantity: number;
    note?: string | null;
};

export type ApiOrderRow = {
  id: string;
  tableId: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELLED";
  items: ApiOrderItemRow[];
};

// Chuẩn hoá payload trả về từ BE list/detail
function normalizeOrder(row: any): ApiOrderRow {
  return {
    id: row.id,
    tableId: row.table?.id ?? row.tableId,
    status: row.status,
    items: (row.items ?? []).map((it: any) => ({
      id: it.id,
      menuItemId: it.menuItem?.id ?? it.menuItemId,
      quantity: it.quantity,
       note: it.note ?? null,    
    })),
  };
}

/** Lấy các đơn "active" (loại PAID/CANCELLED) */
export async function listActiveOrders(): Promise<ApiOrderRow[]> {
  const res = await api.get("/orders", { params: { page: 1, limit: 100 } });
  const rows = res.data?.data ?? res.data ?? [];
  return rows
    .filter((o: any) => o.status !== "PAID" && o.status !== "CANCELLED")
    .map(normalizeOrder);
}

export async function createOrder(payload: {
  tableId: string;
  items: { menuItemId: string; quantity: number }[];
  orderType?: "DINE_IN" | "TAKE_AWAY";
}) {
  const res = await api.post("/orders", payload);
  return normalizeOrder(res.data);
}

export async function addItems(orderId: string, items: { menuItemId: string; quantity: number }[]) {
  const res = await api.post(`/orders/${orderId}/items`, { items });
  return normalizeOrder(res.data);
}

export async function updateOrderStatus(orderId: string, status: ApiOrderRow["status"]) {
  const res = await api.patch(`/orders/${orderId}/status`, { status });
  return normalizeOrder(res.data);
}

export async function removeOrderItem(orderId: string, orderItemId: string) {
  const res = await api.patch(`/orders/${orderId}/items/${orderItemId}/remove`);
  return normalizeOrder(res.data);
}
