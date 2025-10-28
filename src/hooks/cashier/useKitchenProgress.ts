// src/hooks/cashier/useKitchenProgress.ts
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { getSocket } from "@/lib/socket";

// ===== Types =====
export type ItemStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

type ProgressRow = {
  menuItemId: string;
  name: string;
  notified: number;  // tổng đã báo bếp (mọi trạng thái)
  preparing: number;
  ready: number;
  served: number;
  cooked: number;    // = ready + served
};

// Kiểu event từ socket (hỗ trợ cả 2 phiên bản BE)
type TicketChangeV1 = {
  orderId: string;
  menuItemId: string;
  status: ItemStatus; // trạng thái hiện tại (toStatus)
  qty: number;
  ticketId?: string;
};

type TicketChangeV2 = {
  orderId: string;
  ticketId: string;
  menuItemId: string;
  qty: number;
  fromStatus: ItemStatus;
  toStatus: ItemStatus;
};

type TicketChangedPayload =
  | { items: TicketChangeV1[] }
  | { items: TicketChangeV2[] };

// ===== Hook =====
export function useKitchenProgress(orderId?: string | null) {
  const qc = useQueryClient();

  // 1) Snapshot từ BE
  const q = useQuery({
    queryKey: ["kitchen-progress", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await api.get(`/kitchen/orders/${orderId}/progress`);
      // BE trả ProgressRow[] (đã gộp sẵn)
      return res.data as ProgressRow[];
    },
    staleTime: 10_000,
  });

  // 2) Realtime qua Socket: cập nhật gia tăng tại chỗ
 useEffect(() => {
  if (!orderId) return;
  const s = getSocket();

  // để tránh spam refetch nếu bếp bắn dồn dập, debounce nhẹ 150ms
  let t: any = null;
  const trigger = () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["kitchen-progress", orderId] });
      t = null;
    }, 150);
  };

  const onChange = (p: { items: Array<{ orderId: string }> }) => {
    const hit = (p?.items ?? []).some(i => i.orderId === orderId);
    if (hit) trigger();
  };

  s.on("kitchen:ticket_status_changed", onChange);
  return () => {
    s.off("kitchen:ticket_status_changed", onChange);
    if (t) clearTimeout(t);
  };
}, [orderId, qc]);


  // 3) Map nhanh: menuItemId -> cooked
  const cookedMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of q.data ?? []) m.set(r.menuItemId, r.cooked);
    return m;
  }, [q.data]);

  return { data: q.data ?? [], cookedMap, isLoading: q.isLoading };
}
