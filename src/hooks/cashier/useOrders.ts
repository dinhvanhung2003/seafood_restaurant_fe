"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import type { OrdersByTable, UIOrderItem } from "@/lib/cashier/pos-helpers";
import type { ItemStatus } from "@/types/types";

const _uid = () => Math.random().toString(36).slice(2, 9);

// Tạo batchId an toàn phía client
const makeBatchId = () => {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch { }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

/* ----------------------- API helpers (qua axios instance) ----------------------- */
async function fetchOrders() {
  const res = await api.get("/orders", {
    params: { page: 1, limit: 10, excludeStatus: "PAID,CANCELLED,MERGED" },
  });
  const json = res.data;
  return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
}

/* ----------------------- Hook chính ----------------------- */
export function useOrders() {
  const qc = useQueryClient();

  const [orders, setOrders] = useState<OrdersByTable>({});
  const [orderIds, setOrderIds] = useState<Record<string, string>>({});

  const activeOrdersQuery = useQuery({
    queryKey: ["active-orders"], // đủ nếu auth chạy qua interceptor
    queryFn: () => fetchOrders(),
    enabled: true, // nếu vẫn muốn chặn khi chưa có token: !!token
    staleTime: 10_000,
  });

  // Hydrate local state từ data của query
  useEffect(() => {
    const rows = activeOrdersQuery.data ?? [];

    setOrders(prev => {
      const next: OrdersByTable = {};
      const nextOrderIds: Record<string, string> = {};

      for (const o of rows) {
        const tid = o.table?.id ?? o.tableId;
        if (!tid) continue;

        // map tableId -> orderId để các mutation dùng
        nextOrderIds[tid] = o.id;

        // items hiện tại
      const items: UIOrderItem[] = (o.items ?? []).map((it: any) => ({
  id: it.menuItem?.id ?? it.menuItemId,
  qty: it.quantity,
  rowId: it.id,
  name: it.menuItem?.name,
  // Ưu tiên it.price (đơn giá “chốt” theo hóa đơn), fallback menuItem.price
  price:
    it.price != null
      ? Number(it.price)
      : Number(it.menuItem?.price ?? 0),
  image: it.menuItem?.image,
  note: it.note ?? null,   // 👈 THÊM DÒNG NÀY
}));


        // dùng order.id làm tab id (ổn định)
        const tabId = o.id;

        // nếu trước đó đã có activeId hợp lệ, giữ nguyên
        const prevActive = prev[tid]?.activeId;
        const prevHasTab = prev[tid]?.orders?.some(t => t.id === prevActive);
        const activeId = prevHasTab ? prevActive : tabId;
         const guestCount: number | null =
          typeof o.guestCount === "number"
            ? o.guestCount
            : o.guest_count ?? null;

        const rawCus = o.customer ?? o.customer_id ?? o.invoice?.customer;
        const customer = rawCus
          ? {
              id: rawCus.id,
              name: rawCus.name,
              phone: rawCus.phone ?? null,
            }
          : null;

       next[tid] = {
  activeId,
  orders: [
    {
      id: tabId,
      label: "1",
      items,
      guestCount,
      customer,
    },
  ],
};

      }

      // cập nhật cả orderIds cho mutations
      setOrderIds(nextOrderIds);
      return next;
    });
  }, [activeOrdersQuery.data]);


  /* ----------------------- Mutations ----------------------- */
  const updateMetaMu = useMutation({
    mutationFn: async (arg: {
      orderId: string;
      guestCount?: number;
      customerId?: string | null;
    }) => {
      const body: any = {};
      if (arg.guestCount !== undefined) body.guestCount = arg.guestCount;
      if (arg.customerId !== undefined) body.customerId = arg.customerId;

      const res = await api.patch(`/orders/${arg.orderId}/meta`, body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
  });

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
        return { ok: true, data: res.data as any };
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 404) return { ok: false, reason: "NOT_FOUND" as const };
        if (status === 400) return { ok: false, reason: "LOCKED" as const };
        throw e;
      }
    },
    onSuccess: (data) => {
      if (data?.ok) qc.invalidateQueries({ queryKey: ["active-orders"] });
    },
  });


  const muMoveOne = useMutation({
    mutationFn: ({ itemId, to }: { itemId: string; to: ItemStatus }) =>
      api.patch("/orderitems/move-one", { itemId, to }).then((r) => r.data),
    onSuccess: () => {
      const hit = (k: string) => qc.invalidateQueries({ queryKey: ["items", k] });
      hit("NEW_ROWS");
      hit("PREPARING");
      hit("READY");
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
      const res = await api.patch(`/orders/${orderId}/cancel`, { reason: "Cashier cancel" });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
  });

  /* ----------------------- Actions ----------------------- */

  // Thêm 1 món (tạo order nếu chưa có)
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
      return;
    }

    const curItems = orders[tableId]?.orders?.[0]?.items ?? [];
    const ex = curItems.find((x) => x.id === menuItemId);

    if (!ex?.rowId) {
      await addItemsMu.mutateAsync({ orderId: oid, items: [{ menuItemId, quantity: 1 }] });
      return;
    }

    // đã có rowId -> thử tăng qty
    const r = await setItemQtyMu.mutateAsync({
      orderId: oid,
      orderItemId: ex.rowId,
      quantity: ex.qty + 1,
      menuItemId,
    });

    if (!r?.ok) {
      // row bị khóa (PREPARING/READY) hoặc 404 -> tạo dòng mới
      if (r.reason === "LOCKED" || r.reason === "NOT_FOUND") {
        await addItemsMu.mutateAsync({ orderId: oid, items: [{ menuItemId, quantity: 1 }] });
      }
    }
  }

  async function setGuestCount(tableId: string, value: number) {
    const oid = orderIds[tableId];
    if (!oid) return toast.error("Chưa có đơn để set số khách");
    await updateMetaMu.mutateAsync({ orderId: oid, guestCount: value });
  }

  async function setOrderCustomer(tableId: string, customerId: string | null) {
    const oid = orderIds[tableId];
    if (!oid) return toast.error("Chưa có đơn để chọn khách");
    await updateMetaMu.mutateAsync({ orderId: oid, customerId });
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
      // Tạo đơn ban đầu với các items
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

  async function changeQty(
    tableId: string,
    menuItemId: string,
    delta: number,
    currentItems: UIOrderItem[],
  ) {
    const oid = orderIds[tableId];
    if (!oid) {
      if (delta > 0) return addOne(tableId, menuItemId);
      return;
    }

    const it = currentItems.find((x) => x.id === menuItemId);
    const cur = it?.qty ?? 0;
    const next = Math.max(0, cur + delta);

    // 👉 QUY TẮC MỚI:
    // 1) Mọi lần tăng (delta > 0) sau khi đã có dòng (đã từng báo bếp)
    //    -> TẠO DÒNG MỚI CHO DELTA để BE phát socket notify
    // 2) Giảm hoặc về 0 -> PATCH /qty như cũ
    if (delta > 0 && it?.rowId) {
      const batchId = makeBatchId(); // giữ unique để kitchen không bị dedupe
      await addItemsMu.mutateAsync({
        orderId: oid,
        items: [{ menuItemId, quantity: delta }],
        batchId,
      });
      return;
    }

    // chưa có dòng mà delta > 0 -> thêm dòng như cũ
    if (!it && delta > 0) {
      await addItemsMu.mutateAsync({ orderId: oid, items: [{ menuItemId, quantity: 1 }] });
      return;
    }
    if (!it) return;

    // giảm số lượng / về 0 vẫn PATCH /qty để đồng bộ
    try {
      await setItemQtyMu.mutateAsync({
        orderId: oid,
        orderItemId: it.rowId!,
        quantity: next,
        menuItemId,
      });
    } catch (e: any) {
      // fallback: nếu BE khóa dòng, vẫn tạo dòng mới cho delta dương
      if (delta > 0 && (e?.response?.status === 400 || e?.response?.status === 404)) {
        await addItemsMu.mutateAsync({
          orderId: oid,
          items: [{ menuItemId, quantity: delta }],
        });
        return;
      }
      throw e;
    }
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
    addMany, // dùng để gom món trong 1 batch
    addWithBatch, // alias
    changeQty,
    clear,
    confirm,
    pay: payByCash,
    cancel,
      setGuestCount,
    setOrderCustomer,
  };
}
