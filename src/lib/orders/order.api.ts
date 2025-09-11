// lib/orders.api.ts
import { api } from "@/lib/axios";

// ===== Types =====
export type OrderStatus =
  | "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELLED";

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  items: {
    id: string; // orderItemId
    quantity: number;
    price: number;
    menuItem: { id: string; name: string; image?: string | null };
  }[];
};

export type CreateOrderBody = {
  tableId: string;
  items: { menuItemId: string; quantity: number }[];
  orderType?: "DINE_IN" | "TAKE_AWAY";
};

export async function createOrder(body: CreateOrderBody) {
  const { data } = await api.post<OrderDetail>("/orders", body);
  return data;
}

export async function addOrderItems(
  orderId: string,
  items: { menuItemId: string; quantity: number }[]
) {
  const { data } = await api.post<OrderDetail>(`/orders/${orderId}/items`, { items });
  return data;
}

export async function removeOrderItem(orderId: string, orderItemId: string) {
  const { data } = await api.patch<OrderDetail>(
    `/orders/${orderId}/items/${orderItemId}/remove`
  );
  return data;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data } = await api.patch<OrderDetail>(`/orders/${orderId}/status`, { status });
  return data;
}

export async function getOrder(orderId: string) {
  const { data } = await api.get<OrderDetail>(`/orders/${orderId}`);
  return data;
}
