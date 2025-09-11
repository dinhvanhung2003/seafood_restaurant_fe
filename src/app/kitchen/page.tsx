"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import {
  Volume2, Settings, Bell, Menu,
  UtensilsCrossed, Clock4, ChefHat, CheckCircle2, Truck
} from "lucide-react";
import api from "@/lib/axios";

/* ================= Types ================= */
type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELLED";

type ApiOrderItem = {
  id: string;
  quantity: number;
  price: string | number;
  isCooked?: boolean;
  menuItem: { id: string; name: string };
};

type ApiOrder = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  table: { id: string; name: string };
  items: ApiOrderItem[];
};

export type Ticket = {
  id: string;          // orderId
  orderId: string;
  table: string;
  items: { name: string; qty: number }[];
  createdAt: string;
  priority?: "high" | "normal";
  note?: string;
};

/* ================= API helpers ================= */
async function listOrdersByStatus(status: OrderStatus, page = 1, limit = 50): Promise<ApiOrder[]> {
  const res = await api.get("/orders", { params: { status, page, limit } });
  // giả định BE trả về { data: ApiOrder[] } hoặc mảng trực tiếp — sửa theo payload thực tế
  return (res.data?.data ?? res.data) as ApiOrder[];
}

async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const res = await api.patch(`/orders/${orderId}/status`, { status });
  return res.data;
}

/* ================= UI helpers ================= */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-slate-400">
      <UtensilsCrossed className="mb-3 h-16 w-16 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function TicketCard({
  t,
  variant,
  onStart,
  onComplete,
  onServe,
}: {
  t: Ticket;
  variant: "new" | "preparing" | "ready";
  onStart?: (t: Ticket) => void;     // -> PREPARING
  onComplete?: (t: Ticket) => void;  // -> READY
  onServe?: (t: Ticket) => void;     // -> SERVED
}) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-slate-800">{t.table}</div>
        <div className="flex items-center gap-2">
          {t.priority === "high" && <Badge className="bg-red-600">Ưu tiên</Badge>}
          <div className="flex items-center text-xs text-slate-500">
            <Clock4 className="mr-1 h-4 w-4" />
            {t.createdAt}
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {t.items.map((it, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="truncate">{i + 1}. {it.name}</div>
            <div className="font-semibold">x{it.qty}</div>
          </div>
        ))}
      </div>

      {t.note && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">
          📝 {t.note}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {variant === "new" && (
          <Button size="sm" className="h-8" onClick={() => onStart?.(t)}>
            <ChefHat className="mr-2 h-4 w-4" />
            Bắt đầu nấu
          </Button>
        )}
        {variant === "preparing" && (
          <Button size="sm" variant="secondary" className="h-8" onClick={() => onComplete?.(t)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Hoàn tất (READY)
          </Button>
        )}
        {variant === "ready" && (
          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-600/90" onClick={() => onServe?.(t)}>
            <Truck className="mr-2 h-4 w-4" />
            Cung ứng (SERVED)
          </Button>
        )}
      </div>
    </div>
  );
}

/* ================= Main Screen ================= */
export default function KitchenScreen() {
  const qc = useQueryClient();

  // 1) Query ba cột
  const qConfirmed = useQuery({
    queryKey: ["orders", "CONFIRMED"],
    queryFn: () => listOrdersByStatus("CONFIRMED", 1, 50),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  const qPreparing = useQuery({
    queryKey: ["orders", "PREPARING"],
    queryFn: () => listOrdersByStatus("PREPARING", 1, 50),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  const qReady = useQuery({
    queryKey: ["orders", "READY"],
    queryFn: () => listOrdersByStatus("READY", 1, 50),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  // 2) Mutations đổi trạng thái
  const muUpdate = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: (_data, vars) => {
      // refetch các cột liên quan
      const hit = (status: OrderStatus) => qc.invalidateQueries({ queryKey: ["orders", status] });
      hit("CONFIRMED");
      hit("PREPARING");
      hit("READY");
      // nếu đã SERVED thì cũng có thể invalid list SERVED (nếu bạn có cột 4)
      if (vars.status === "SERVED") qc.invalidateQueries({ queryKey: ["orders", "SERVED"] });
    },
  });

  // 3) Map ApiOrder -> Ticket
  const toTicket = (o: ApiOrder): Ticket => ({
    id: o.id,
    orderId: o.id,
    table: o.table?.name ?? "—",
    createdAt: new Date(o.createdAt).toLocaleString(),
    items: o.items.map((it) => ({ name: it.menuItem.name, qty: it.quantity })),
  });

  const listNew = useMemo(() => (qConfirmed.data ?? []).map(toTicket), [qConfirmed.data]);
  const listCooking = useMemo(() => (qPreparing.data ?? []).map(toTicket), [qPreparing.data]);
  const listReady = useMemo(() => (qReady.data ?? []).map(toTicket), [qReady.data]);

  // 4) Socket: khi thu ngân bắn món mới → refetch CONFIRMED
  useEffect(() => {
    (async () => { await fetch("/api/socket").catch(() => {}); })(); // đảm bảo server socket
    const s = getSocket();

    const handleSingle = (p: any) => {
      // p: { orderId, itemId, name, qty, tableName, createdAt, priority }
      toast.success(`Món mới: ${p.name}`, {
        description: `${p.qty} × ${p.name} • ${p.tableName}`,
      });
      qc.invalidateQueries({ queryKey: ["orders", "CONFIRMED"] });
    };

    const handleBatch = (p: any) => {
      // p: { orderId, tableName, createdAt, items: [{itemId,name,qty}], priority }
      const count = Array.isArray(p?.items) ? p.items.length : 1;
      toast.success(`Có ${count} món mới`, { description: `Bàn ${p.tableName}` });
      qc.invalidateQueries({ queryKey: ["orders", "CONFIRMED"] });
    };

    s.on("cashier:notify_item", handleSingle);
    s.on("cashier:notify_items", handleBatch);

    return () => {
      s.off("cashier:notify_item", handleSingle);
      s.off("cashier:notify_items", handleBatch);
    };
  }, [qc]);

  // 5) Handlers
  const startCooking = async (t: Ticket) => {
    try {
      await muUpdate.mutateAsync({ orderId: t.orderId, status: "PREPARING" });
      toast.success(`Bắt đầu nấu • ${t.table}`);
    } catch (e: any) {
      toast.error("Không thể chuyển PREPARING", { description: e?.message });
    }
  };

  const markReady = async (t: Ticket) => {
    try {
      await muUpdate.mutateAsync({ orderId: t.orderId, status: "READY" });
      toast.success(`Đã nấu xong • ${t.table}`);
    } catch (e: any) {
      toast.error("Không thể chuyển READY", { description: e?.message });
    }
  };

  const serve = async (t: Ticket) => {
    try {
      await muUpdate.mutateAsync({ orderId: t.orderId, status: "SERVED" });
      toast.success(`Đã cung ứng • ${t.table}`);
    } catch (e: any) {
      toast.error("Không thể chuyển SERVED", { description: e?.message });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#0B3C86] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-lg font-semibold">Màn Bếp</div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10"><Volume2 /></Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10"><Settings /></Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10"><Bell /></Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10"><Menu /></Button>
        </div>
      </div>

      {/* 3 cột trạng thái */}
      <div className="grid flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-3">
        {/* CONFIRMED */}
        <div className="rounded-2xl bg-white p-3 shadow-lg text-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold text-[#0B3C86]">Mới / Đã xác nhận</div>
            <Badge variant="secondary">{listNew.length}</Badge>
          </div>
          <div className="h-[calc(100vh-180px)]">
            {qConfirmed.isLoading ? (
              <EmptyState text="Đang tải..." />
            ) : listNew.length === 0 ? (
              <EmptyState text="Chưa có đơn mới" />
            ) : (
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {listNew.map((t) => (
                    <TicketCard key={t.id} t={t} variant="new" onStart={startCooking} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* PREPARING */}
        <div className="rounded-2xl bg-white p-3 shadow-lg text-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold text-[#0B3C86]">Đang chế biến</div>
            <Badge variant="secondary">{listCooking.length}</Badge>
          </div>
          <div className="h-[calc(100vh-180px)]">
            {qPreparing.isLoading ? (
              <EmptyState text="Đang tải..." />
            ) : listCooking.length === 0 ? (
              <EmptyState text="Chưa có món đang nấu" />
            ) : (
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {listCooking.map((t) => (
                    <TicketCard key={t.id} t={t} variant="preparing" onComplete={markReady} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* READY */}
        <div className="rounded-2xl bg-white p-3 shadow-lg text-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold text-[#0B3C86]">Sẵn sàng cung ứng</div>
            <Badge variant="secondary">{listReady.length}</Badge>
          </div>
          <div className="h-[calc(100vh-180px)]">
            {qReady.isLoading ? (
              <EmptyState text="Đang tải..." />
            ) : listReady.length === 0 ? (
              <EmptyState text="Chưa có món sẵn sàng" />
            ) : (
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {listReady.map((t) => (
                    <TicketCard key={t.id} t={t} variant="ready" onServe={serve} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
