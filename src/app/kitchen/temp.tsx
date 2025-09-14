import api from "@/lib/axios";

type ItemStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

type ApiOrderItemExt = {
  id: string;                // <- orderItemId (bắt buộc)
  quantity: number;
  status: ItemStatus;
  createdAt: string;
  batchId?: string | null;   // <- nếu BE có
  menuItem: { id: string; name: string };
  order:   { id: string; table: { id: string; name: string } };
};

export type Ticket = {
  id: string;                // ticket id (ưu tiên dùng batchId)
  orderId: string;
  table: string;
  createdAt: string;
  items: { name: string; qty: number }[];
  itemIds: string[];         // <- QUAN TRỌNG: danh sách orderItemId trong ticket
  priority?: "high" | "normal";
  note?: string;
};

// ===== API helpers theo ITEM =====
async function listItemsByStatus(status: ItemStatus, page = 1, limit = 200): Promise<ApiOrderItemExt[]> {
  const res = await api.get("/orderitems", { params: { status, page, limit } });
  return (res.data?.data ?? res.data) as ApiOrderItemExt[];
}

// Đổi trạng thái cho 1 batch item
async function updateItemsStatus(itemIds: string[], status: ItemStatus) {
  const res = await api.patch("/orderitems/status", { itemIds, status });
  return res.data;
}