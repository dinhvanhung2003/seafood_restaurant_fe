"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import type { OrdersByTable, UIOrderItem } from "@/lib/cashier/pos-helpers";
import type { ItemStatus } from "@/types/types";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const _uid = () => Math.random().toString(36).slice(2, 9);

// Tạo batchId an toàn phía client
const makeBatchId = () => {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

type UseOrdersArgs = {
  token?: string;
  menuItems: { id: string; price: number }[];
};

/* ----------------------- API helpers ----------------------- */
async function fetchOrders(token?: string) {
  const url = `${API_BASE}/orders?page=1&limit=200&excludeStatus=PAID,CANCELLED`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
}

/* ----------------------- Hook chính ----------------------- */
export function useOrders({ token }: UseOrdersArgs) {
  const qc = useQueryClient();

  const [orders, setOrders] = useState<OrdersByTable>({});
  const [orderIds, setOrderIds] = useState<Record<string, string>>({});

  const activeOrdersQuery = useQuery({
    queryKey: ["active-orders", token],
    queryFn: () => fetchOrders(token),
    enabled: !!token,
    staleTime: 10_000,
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
        rowId: it.id, // orderItemId
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

  // Thêm items (có thể kèm batchId)
  const addItemsMu = useMutation({
    mutationFn: async (arg: {
      orderId: string;
      items: { menuItemId: string; quantity: number }[];
      batchId?: string;
    }) => {
      const body = arg.batchId ? { items: arg.items, batchId: arg.batchId } : { items: arg.items };
      const res = await api.post(`/orders/${arg.orderId}/items`, body);
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
        const res = await api.patch(`/orders/${arg.orderId}/items/${arg.orderItemId}/qty`, {
          quantity: arg.quantity,
        });
        return res.data;
      } catch (e: any) {
        if (e?.response?.status === 404) {
          // fallback: remove + add lại
          await api.patch(`/orders/${arg.orderId}/items/${arg.orderItemId}/remove`, {});
          if (arg.quantity > 0) {
            await api.post(`/orders/${arg.orderId}/items`, {
              items: [{ menuItemId: arg.menuItemId, quantity: arg.quantity }],
            });
          }
          return { ok: true };
        }
        if (e?.response?.status === 400) {
          toast.error("Không thể chỉnh số lượng ở trạng thái hiện tại.");
        }
        throw e;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
  });




const muMoveOne = useMutation({
  mutationFn: ({ itemId, to }: { itemId: string; to: ItemStatus }) =>
    api.patch('/orderitems/move-one', { itemId, to }),
  onSuccess: () => {
    const hit = (k: string) => qc.invalidateQueries({ queryKey: ['items', k] });
    hit('NEW_ROWS'); hit('PREPARING'); hit('READY');
  },
});


  // Soft re-confirm (báo bếp)
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

  // Invoice + cash
  const createInvoiceMu = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const res = await api.post(`/invoices/from-order/${orderId}`);
      return res.data;
    },
  });

   const cashPayMu = useMutation({
    mutationFn: async ({ invoiceId, amount }: { invoiceId: string; amount: number }) => {
      const res = await api.post(`/invoices/${invoiceId}/payments`, {
        amount,
        method: "CASH",
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
  });

  const cancelMu = useMutation({
    mutationFn: async (orderId: string) => {
      await api.patch(`/orders/${orderId}/cancel`, { reason: "Cashier cancel" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
  });

  /* ----------------------- Actions ----------------------- */

  // Thêm 1 món (tạo order nếu chưa có)
  async function addOne(tableId: string, menuItemId: string) {
  let oid = orderIds[tableId];
  if (!oid) {
    const created = await createOrderMu.mutateAsync({
      tableId, items: [{ menuItemId, quantity: 1 }], orderType: "DINE_IN",
    });
    oid = created.id;
    setOrderIds((p) => ({ ...p, [tableId]: oid! }));
    return;
  }

  // tìm item hiện có (theo menuItemId) trong state hiện tại
  const curItems = orders[tableId]?.orders?.[0]?.items ?? [];
  const ex = curItems.find((x) => x.id === menuItemId);

  if (ex?.rowId) {
    // tăng số lượng trên đúng dòng (không tạo dòng mới)
    await setItemQtyMu.mutateAsync({
      orderId: oid, orderItemId: ex.rowId, quantity: ex.qty + 1, menuItemId
    });
  } else {
    await addItemsMu.mutateAsync({ orderId: oid, items: [{ menuItemId, quantity: 1 }] });
  }
}

  // Thêm nhiều món trong 1 lần báo (gom cùng batchId)
  async function addMany(
    tableId: string,
    items: { menuItemId: string; quantity: number }[],
    opts?: { batchId?: string },
  ) {
    const batchId = opts?.batchId || makeBatchId();
    let oid = orderIds[tableId];

    if (!oid) {
      // Tạo đơn ban đầu với các items (nếu muốn đảm bảo batch cho lần đầu,
      // có thể tạo đơn trống rồi gọi addItemsMu với batchId; tuỳ bạn).
      const created = await createOrderMu.mutateAsync({
        tableId,
        items,
        orderType: "DINE_IN",
      });
      oid = created.id;
      setOrderIds((p) => ({ ...p, [tableId]: oid! }));
    } else {
      await addItemsMu.mutateAsync({ orderId: oid, items, batchId });
    }

    return { orderId: oid, batchId };
  }

  const addWithBatch = addMany;

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

  // “Báo bếp” (soft re-confirm)
  async function confirm(tableId: string) {
    const oid = orderIds[tableId];
    if (!oid) return toast.error("Chưa có đơn để gửi bếp");
    await updateStatusMu.mutateAsync({ orderId: oid, status: "CONFIRMED" });
  }

  // Thanh toán tiền mặt
  async function payByCash(tableId: string, amount: number) {
    const oid = orderIds[tableId];
    if (!oid) return;
    const inv = await createInvoiceMu.mutateAsync({ orderId: oid });
    const invoiceId = inv?.id ?? inv?.data?.id ?? inv?.invoice?.id;
    await cashPayMu.mutateAsync({ invoiceId, amount });
    qc.invalidateQueries({ queryKey: ["active-orders"] });
  }

  async function cancel(tableId: string) {
    const oid = orderIds[tableId];
    if (!oid) return;
    await cancelMu.mutateAsync(oid);
  }

  return {
    activeOrdersQuery,
    orders,
    orderIds,
    addOne,
    addMany,       // dùng để gom món trong 1 batch
    addWithBatch,  // alias
    changeQty,
    clear,
    confirm,
    pay: payByCash,
    cancel,
  };
}
