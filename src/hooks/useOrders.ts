// "use client";

// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { useEffect, useState } from "react";
// import { toast } from "sonner";
// import { api } from "@/lib/axios";
// import type { OrdersByTable, UIOrderItem } from "@/lib/cashier/pos-helpers";

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
// const _uid = () => Math.random().toString(36).slice(2, 9);

// // ---- load orders chưa PAID/CANCELLED ----
// async function fetchOrders(token?: string) {
//   const res = await fetch(`${API_BASE}/orders?page=1&limit=200`, {
//     headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
//     cache: "no-store",
//   });
//   if (!res.ok) throw new Error(await res.text());
//   const json = await res.json();
//   const raw = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
//   return raw.filter((o: any) => o.status !== "PAID" && o.status !== "CANCELLED");
// }

// // lấy order detail để tìm rowId theo menuItemId
// async function resolveRowId(orderId: string, menuItemId: string) {
//   const res = await api.get(`/orders/${orderId}`);
//   const items = res.data?.items ?? [];
//   const found = items.find((x: any) => (x.menuItem?.id ?? x.menuItemId) === menuItemId);
//   return found?.id as string | undefined;
// }

// type UseOrdersArgs = {
//   token?: string;
//   menuItems: { id: string; price: number }[];
// };

// export function useOrders({ token, menuItems }: UseOrdersArgs) {
//   const qc = useQueryClient();

//   const [orders, setOrders] = useState<OrdersByTable>({});
//   const [orderIds, setOrderIds] = useState<Record<string, string>>({});

//   const activeOrdersQuery = useQuery({
//     queryKey: ["active-orders", token],
//     queryFn: () => fetchOrders(token),
//     enabled: !!token,
//     staleTime: 10_000,
//   });

//   // v5: thay cho onSuccess – hydrate state từ data
//   useEffect(() => {
//     const rows: any[] = activeOrdersQuery.data ?? [];
//     const nextOrders: OrdersByTable = {};
//     const nextOrderIds: Record<string, string> = {};

//     for (const o of rows) {
//       const tid = o.table?.id ?? o.tableId;
//       if (!tid) continue;

//       nextOrderIds[tid] = o.id;

//       const items: UIOrderItem[] = (o.items ?? []).map((it: any) => ({
//         id: it.menuItem?.id ?? it.menuItemId,
//         qty: it.quantity,
//         rowId: it.id, // quan trọng cho việc giảm qty
//       }));

//       const bid = _uid();
//       nextOrders[tid] = { activeId: bid, orders: [{ id: bid, label: "1", items }] };
//     }

//     setOrders(nextOrders);
//     setOrderIds(nextOrderIds);
//   }, [activeOrdersQuery.data]);

//   // ===== mutations =====
//   const createOrderMu = useMutation({
//     mutationFn: async (payload: {
//       tableId: string;
//       items: { menuItemId: string; quantity: number }[];
//       orderType?: "DINE_IN" | "TAKE_AWAY";
//     }) => {
//       const res = await api.post("/orders", { orderType: payload.orderType ?? "DINE_IN", ...payload });
//       return res.data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
//   });

//   const addItemsMu = useMutation({
//     mutationFn: async (arg: { orderId: string; items: { menuItemId: string; quantity: number }[] }) => {
//       const res = await api.post(`/orders/${arg.orderId}/items`, { items: arg.items });
//       return res.data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
//   });

//   const removeItemMu = useMutation({
//     mutationFn: async (arg: { orderId: string; orderItemId: string }) => {
//       const res = await api.patch(`/orders/${arg.orderId}/items/${arg.orderItemId}/remove`, {});
//       return res.data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
//   });

//   const setItemQtyMu = useMutation({
//     // nếu BE chưa có /qty thì fallback remove + add
//     mutationFn: async (arg: {
//       orderId: string;
//       orderItemId: string;
//       quantity: number;
//       menuItemId: string;
//     }) => {
//       try {
//         const res = await api.patch(`/orders/${arg.orderId}/items/${arg.orderItemId}/qty`, {
//           quantity: arg.quantity,
//         });
//         return res.data;
//       } catch {
//         await api.patch(`/orders/${arg.orderId}/items/${arg.orderItemId}/remove`, {});
//         if (arg.quantity > 0) {
//           await api.post(`/orders/${arg.orderId}/items`, {
//             items: [{ menuItemId: arg.menuItemId, quantity: arg.quantity }],
//           });
//         }
//         return { ok: true };
//       }
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
//   });

//   const updateStatusMu = useMutation({
//     mutationFn: async (arg: {
//       orderId: string;
//       status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELLED";
//     }) => {
//       const res = await api.patch(`/orders/${arg.orderId}/status`, { status: arg.status });
//       return res.data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["active-orders"] }),
//   });

//   // ===== actions =====
//   async function addOne(tableId: string, menuItemId: string) {
//     let oid = orderIds[tableId];
//     if (!oid) {
//       const created = await createOrderMu.mutateAsync({
//         tableId,
//         items: [{ menuItemId, quantity: 1 }],
//         orderType: "DINE_IN",
//       });
//       oid = created.id;
//       setOrderIds((p) => ({ ...p, [tableId]: oid! }));
//     } else {
//       await addItemsMu.mutateAsync({ orderId: oid, items: [{ menuItemId, quantity: 1 }] });
//     }
//   }

//   /**
//    * Tăng/giảm số lượng cho 1 món:
//    * - Tăng: addItems với delta dương
//    * - Giảm: cần rowId (nếu chưa có thì GET /orders/:id để tìm), rồi setQty/remove
//    */
//   async function changeQty(tableId: string, menuItemId: string, delta: number, currentItems: UIOrderItem[]) {
//     const oid = orderIds[tableId];
//     if (!oid) {
//       if (delta > 0) return addOne(tableId, menuItemId);
//       return;
//     }

//     const it = currentItems.find((x) => x.id === menuItemId);
//     const cur = it?.qty ?? 0;
//     const next = Math.max(0, cur + delta);

//     if (next > cur) {
//       const inc = next - cur;
//       await addItemsMu.mutateAsync({ orderId: oid, items: [{ menuItemId, quantity: inc }] });
//       return;
//     }
//     if (next === cur) return;

//     let rowId = it?.rowId;
//     if (!rowId) rowId = await resolveRowId(oid, menuItemId);
//     if (!rowId) {
//       await qc.invalidateQueries({ queryKey: ["active-orders"] });
//       toast.error("Không xác định được món để bớt, vui lòng thử lại.");
//       return;
//     }

//     await setItemQtyMu.mutateAsync({
//       orderId: oid,
//       orderItemId: rowId,
//       quantity: next,
//       menuItemId,
//     });
//   }

//   async function clear(tableId: string, items: UIOrderItem[]) {
//     const oid = orderIds[tableId];
//     if (!oid) return;
//     for (const it of items) {
//       const rowId = it.rowId ?? (await resolveRowId(oid, it.id));
//       if (rowId) await removeItemMu.mutateAsync({ orderId: oid, orderItemId: rowId });
//     }
//   }

//   async function confirm(tableId: string) {
//     const oid = orderIds[tableId];
//     if (!oid) return toast.error("Chưa có đơn để gửi bếp");
//     await updateStatusMu.mutateAsync({ orderId: oid, status: "CONFIRMED" });
//   }

//   async function pay(tableId: string) {
//     const oid = orderIds[tableId];
//     if (!oid) return;
//     await updateStatusMu.mutateAsync({ orderId: oid, status: "PAID" });
//   }

//   return {
//     activeOrdersQuery,
//     orders,
//     orderIds,
//     addOne,
//     changeQty,
//     clear,
//     confirm,
//     pay,
//   };
// }
