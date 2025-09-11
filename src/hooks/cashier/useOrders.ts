"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import type { OrdersByTable, UIOrderItem } from "@/lib/cashier/pos-helpers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const _uid = () => Math.random().toString(36).slice(2, 9);
type UseOrdersArgs = {
  token?: string;
  menuItems: { id: string; price: number }[];
};
/* ----------------------- API helpers ----------------------- */
async function fetchOrders(token?: string) {
  const res = await fetch(`${API_BASE}/orders?page=1&limit=200`, {
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  // lọc PAID/CANCELLED nếu BE chưa hỗ trợ exclude
  return raw.filter((o: any) => o.status !== "PAID" && o.status !== "CANCELLED");
}

/* ----------------------- Hook chính ----------------------- */
export function useOrders({ token, menuItems }: UseOrdersArgs) {
  const qc = useQueryClient();

  const [orders, setOrders] = useState<OrdersByTable>({});
  const [orderIds, setOrderIds] = useState<Record<string, string>>({});

  // v5: KHÔNG dùng onSuccess. Dùng useEffect bên dưới để hydrate.
  const activeOrdersQuery = useQuery({
    queryKey: ["active-orders", token],
    queryFn: () => fetchOrders(token),
    enabled: !!token,
    staleTime: 10_000,
    // có thể dùng select để transform thêm nếu cần, nhưng không làm side-effect ở đây
    // select: (rows: any[]) => rows,
  });

  // Hydrate local state từ data của query
  useEffect(() => {
    const rows = activeOrdersQuery.data ?? [];
    const nextOrders: OrdersByTable = {};
    const nextOrderIds: Record<string, string> = {};

    for (const o of rows) {
      const tid = o.table?.id ?? o.tableId;
      if (!tid) continue;

      nextOrderIds[tid] = o.id;

      const items: UIOrderItem[] = (o.items ?? []).map((it: any) => ({
        id: it.menuItem?.id ?? it.menuItemId,
        qty: it.quantity,
        rowId: it.id, // id của order_item để PATCH/REMOVE
      }));

      const id = _uid();
      nextOrders[tid] = { activeId: id, orders: [{ id, label: "1", items }] };
    }

    setOrders(nextOrders);
    setOrderIds(nextOrderIds);
  }, [activeOrdersQuery.data]);

  /* ----------------------- Mutations ----------------------- */

  const createOrderMu = useMutation({
    mutationFn: async (payload: {
      tableId: string;
      items: { menuItemId: string; quantity: number }[];
      orderType?: "DINE_IN" | "TAKE_AWAY";
    }) => {
      const res = await api.post("/orders", { orderType: payload.orderType ?? "DINE_IN", ...payload });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
  });

  const addItemsMu = useMutation({
    mutationFn: async (arg: { orderId: string; items: { menuItemId: string; quantity: number }[] }) => {
      const res = await api.post(`/orders/${arg.orderId}/items`, { items: arg.items });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
  });

  const removeItemMu = useMutation({
    mutationFn: async (arg: { orderId: string; orderItemId: string }) => {
      const res = await api.patch(`/orders/${arg.orderId}/items/${arg.orderItemId}/remove`, {});
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
  });

const setItemQtyMu = useMutation({
  mutationFn: async (arg: { orderId: string; orderItemId: string; quantity: number; menuItemId: string }) => {
    try {
      // dùng endpoint mới
      const res = await api.patch(`/orders/${arg.orderId}/items/${arg.orderItemId}/qty`, {
        quantity: arg.quantity,
      });
      return res.data;
    } catch (e: any) {
      // Nếu BE chưa có /qty thì 404 -> fallback remove + add
      if (e?.response?.status === 404) {
        await api.patch(`/orders/${arg.orderId}/items/${arg.orderItemId}/remove`, {});
        if (arg.quantity > 0) {
          await api.post(`/orders/${arg.orderId}/items`, {
            items: [{ menuItemId: arg.menuItemId, quantity: arg.quantity }],
          });
        }
        return { ok: true };
      }

      // 400 từ BE thường là do status không cho sửa
      if (e?.response?.status === 400) {
        toast.error("Không thể chỉnh sửa số lượng khi đơn không ở trạng thái PENDING/CONFIRMED.");
      }
      throw e;
    }
  },
  onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
});


  const updateStatusMu = useMutation({
    mutationFn: async (arg: {
      orderId: string;
      status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELLED";
    }) => {
      const res = await api.patch(`/orders/${arg.orderId}/status`, { status: arg.status });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
  });

  /* ----------------------- Actions (100% qua API) ----------------------- */

  async function addOne(tableId: string, menuItemId: string) {
    let oid = orderIds[tableId];
    if (!oid) {
      const created = await createOrderMu.mutateAsync({
        tableId,
        items: [{ menuItemId, quantity: 1 }],
        orderType: "DINE_IN",
      });
      oid = created.id;
      setOrderIds((p) => ({ ...p, [tableId]: oid! }));
    } else {
      await addItemsMu.mutateAsync({ orderId: oid, items: [{ menuItemId, quantity: 1 }] });
    }
  }

  
// ❶ Tạo invoice từ order (idempotent)
const createInvoiceMu = useMutation({
  mutationFn: async ({ orderId }: { orderId: string }) => {
    const res = await api.post(`/invoices/from-order/${orderId}`);
    return res.data;                  // { id, status, totalAmount, ... }
  },
});

// ❷ Ghi payment tiền mặt
const cashPayMu = useMutation({
  mutationFn: async ({ invoiceId, amount }: { invoiceId: string; amount: number }) => {
    const res = await api.post(`/payments/manual`, { invoiceId, amount });
    return res.data;
  },
  onSuccess: () => qc.invalidateQueries({ queryKey: ['active-orders'] }),
});

// ❸ Hàm public để POS gọi khi bấm thanh toán
async function payByCash(tableId: string, amount: number) {
  const oid = orderIds[tableId];
  if (!oid) return;

  // bước 1: đảm bảo có invoice
  const inv = await createInvoiceMu.mutateAsync({ orderId: oid });
  const invoiceId = inv?.id ?? inv?.data?.id ?? inv?.invoice?.id;

  // bước 2: nộp tiền mặt = tổng
  await cashPayMu.mutateAsync({ invoiceId, amount });

  // BE sẽ tự set order.status = PAID khi invoice = PAID
  qc.invalidateQueries({ queryKey: ['active-orders'] });
}
const cancelMu = useMutation({
  mutationFn: async (orderId: string) => {
    // Nếu bạn triển khai endpoint riêng:
    await api.patch(`/orders/${orderId}/cancel`, { reason: 'Cashier cancel' });
    // Hoặc dùng endpoint chung:
    // await api.patch(`/orders/${orderId}/status`, { status: 'CANCELLED' });
  },
  onSuccess: () => qc.invalidateQueries({ queryKey: ['active-orders'] }),
});

async function cancel(tableId: string) {
  const oid = orderIds[tableId];
  if (!oid) return;
  await cancelMu.mutateAsync(oid);
}

  async function changeQty(tableId: string, menuItemId: string, delta: number, currentItems: UIOrderItem[]) {
    const oid = orderIds[tableId];
    if (!oid) {
      if (delta > 0) return addOne(tableId, menuItemId);
      return;
    }
    const it = currentItems.find((x) => x.id === menuItemId);
    const cur = it?.qty ?? 0;
    const next = Math.max(0, cur + delta);

    if (!it && delta > 0) {
      await addItemsMu.mutateAsync({ orderId: oid, items: [{ menuItemId, quantity: 1 }] });
      return;
    }
    if (!it) return;

    await setItemQtyMu.mutateAsync({ orderId: oid, orderItemId: it.rowId!, quantity: next, menuItemId });
  }

  async function clear(tableId: string, items: UIOrderItem[]) {
    const oid = orderIds[tableId];
    if (!oid) return;
    for (const it of items) {
      if (it.rowId) await removeItemMu.mutateAsync({ orderId: oid, orderItemId: it.rowId });
    }
  }

  async function confirm(tableId: string) {
    const oid = orderIds[tableId];
    if (!oid) return toast.error("Chưa có đơn để gửi bếp");
    await updateStatusMu.mutateAsync({ orderId: oid, status: "CONFIRMED" });
  }

  async function pay(tableId: string) {
    const oid = orderIds[tableId];
    if (!oid) return;
    await updateStatusMu.mutateAsync({ orderId: oid, status: "PAID" });
  }

  return {
    activeOrdersQuery,
    orders,
    orderIds,
    addOne,
    changeQty,
    clear,
    confirm,
     pay: payByCash,
      cancel,
  };




}
