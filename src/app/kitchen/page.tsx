"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import {
  Volume2,
  Settings,
  Bell,
  X
,  Menu as MenuIcon,
  UtensilsCrossed,
  Clock4,
  ChefHat,
  CheckCircle2,
  Truck,
  RotateCcw,
  Ban as BanIcon,
} from "lucide-react";
import api from "@/lib/axios";

/* =============== Types =============== */
type ItemStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "CANCELLED";

export type ApiOrderItemExt = {
  id: string;
  orderItemId?: string | null;
  quantity: number;
  status: ItemStatus;
  createdAt: string;
  batchId?: string | null;
  menuItem: { id: string; name: string };
  order: { id: string; table?: { id: string; name: string } | null };
   note?: string | null; 
    priority?: boolean | null;
};

// === types ===
export type Ticket = {
  id: string;
  orderId: string;
  table: string;
  createdAt: string;
  createdTs: number;
  items: { menuItemId: string; name: string; qty: number }[]; // 👈 thêm menuItemId
  itemIds: string[];
  priority?: "high" | "normal";
  note?: string;
  justArrived?: boolean;
   voided?: boolean;
};

// === mapper ===
function mapRowsToTickets(rows: ApiOrderItemExt[]): Ticket[] {
  return rows
    .filter(r => !!r?.id)
    .map(r => {
      const ts = Date.parse(r.createdAt) || Date.now();
      return {
        id: r.id,
        orderId: r.order.id,
        table: r.order?.table?.name ?? "—",
        createdAt: new Date(r.createdAt).toLocaleString(),
        createdTs: ts,
        items: [{ menuItemId: r.menuItem.id, name: r.menuItem.name, qty: r.quantity }],
        itemIds: [r.id],
        note: r.note ?? undefined,
        priority: r.priority ? "high" : "normal",   // ✅ map ra Ticket.priority
      } as Ticket;
    })
    .sort((a, b) => b.createdTs - a.createdTs);
}





/* =============== API helpers =============== */
async function listItemsByStatus(status: ItemStatus, page = 1, limit = 200) {
  const res = await api.get("/kitchen/tickets", { params: { status, page, limit } });
  return res.data?.data ?? res.data;
}
async function updateItemsStatus(itemIds: string[], status: ItemStatus) {
  const res = await api.patch("/kitchen/tickets/status", { ticketIds: itemIds, status });
  return res.data;
}

/* =============== UI helpers =============== */
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
  voided,
  onStart,
  onComplete,
  onServe,
  onDelete,
  onClear,
   onVoidFromKitchen, 
}: {
  t: Ticket;
  variant: "new" | "preparing" | "ready";
  voided?: boolean;
  onStart?: (t: Ticket) => void;
  onComplete?: (t: Ticket) => void;
  onServe?: (t: Ticket) => void;
  onDelete?: (t: Ticket) => void;
  onClear?: (t: Ticket) => void;
  onVoidFromKitchen?: (t: Ticket) => void;
  
}) {
  return (
   <div
  className={[
    "relative rounded-xl border p-3 shadow-sm transition-all",
    voided
      ? "border-red-400 bg-red-50/70 text-slate-600"
      : "border-slate-200 bg-white",
  ].join(" ")}
>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={["font-semibold text-slate-800", voided ? "line-through" : ""].join(" ")}>
            {t.table}
          </div>
          {t.justArrived && !voided && <Badge className="bg-emerald-600">NEW</Badge>}
          {t.priority === "high" && !voided && <Badge className="bg-red-600">Ưu tiên</Badge>}
          {voided && (
            <Badge variant="destructive" className="gap-1">
              <BanIcon className="h-3.5 w-3.5" />
              Voided
            </Badge>
          )}
        </div>
        <div className="flex items-center text-xs text-slate-500">
          <Clock4 className="mr-1 h-4 w-4" />
          {t.createdAt}
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {t.items.map((it, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className={["truncate", voided ? "line-through" : ""].join(" ")}>
              {i + 1}. {it.name}
            </div>
            <div className={["font-semibold", voided ? "line-through" : ""].join(" ")}>
              x{it.qty}
            </div>
          </div>
        ))}
      </div>

      {t.note && !voided && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">
          📝 {t.note}
        </div>
      )}
 <button
  className="absolute right-2 top-2 text-slate-400 hover:text-red-500"
  onClick={() => onDelete?.(t)}
  title={voided ? "Ẩn phiếu này" : "Xóa khỏi màn hình"}
>
  <X className="h-4 w-4" /> 
</button>
     {voided ? (
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-red-600/80">
            Phiếu đã bị hủy — bếp xác nhận và ấn Clear để ẩn.
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="h-8"
            onClick={() => onClear?.(t)}
            title="Ẩn phiếu đã hủy khỏi màn hình"
          >
            Clear
          </Button>
        </div>
      ) : (
        <>
       

          <div className="mt-3 flex items-center gap-2">
            {variant === "new" && (
              <>
                 <Button size="sm" className="h-8" onClick={() => onStart?.(t)}>
                <ChefHat className="mr-2 h-4 w-4" />
                Bắt đầu nấu (toàn bộ)
              </Button>
                <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => onVoidFromKitchen?.(t)}
              >
                <BanIcon className="mr-2 h-4 w-4" />
                Hủy món
              </Button>
              </>
           
              
            )}
            {variant === "preparing" && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8"
                onClick={() => onComplete?.(t)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Hoàn tất (READY)
              </Button>
            )}
            {variant === "ready" && (
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-600/90"
                onClick={() => onServe?.(t)}
              >
                <Truck className="mr-2 h-4 w-4" />
                Cung ứng (SERVED)
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}



/* =============== Main =============== */
export default function KitchenScreen() {
  const qc = useQueryClient();
  const [socketReady, setSocketReady] = useState(false);
  const [socketTickets, setSocketTickets] = useState<Record<string, Ticket>>({});
  const [listNew, setListNew] = useState<Ticket[]>([]);
  const [listCooking, setListCooking] = useState<Ticket[]>([]);
const [listReady,  setListReady]  = useState<Ticket[]>([]);
  const processedBatchIdsRef = useRef<Set<string>>(new Set());
  const [voidedIds, setVoidedIds] = useState<Set<string>>(new Set());
const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
const [voidModalOpen, setVoidModalOpen] = useState(false);
const [voidTicket, setVoidTicket] = useState<Ticket | null>(null);



const openVoidModal = (t: Ticket) => {
  setVoidTicket(t);
  setVoidModalOpen(true);
};

const handleConfirmVoid = async (qty: number, reason: string) => {
  if (!voidTicket) return;
  await voidFromKitchen(voidTicket, qty, reason);
  setVoidModalOpen(false);
  setVoidTicket(null);
};



  /* =============== Queries =============== */
  const COMMON_Q = {
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    refetchInterval: 0,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  } as const;

  const qNewRows = useQuery({
    queryKey: ["items", "NEW_ROWS"],
    queryFn: async () => {
      const pending = await listItemsByStatus("PENDING", 1, 200);
      const confirmed = await listItemsByStatus("CONFIRMED", 1, 200);
      return [...pending, ...confirmed];
    },
    enabled: socketReady,
  });

  const qPreparingItems = useQuery({
    queryKey: ["items", "PREPARING"],
    queryFn: () => listItemsByStatus("PREPARING", 1, 200),
    ...COMMON_Q,
  });

  const qReadyItems = useQuery({
    queryKey: ["items", "READY"],
    queryFn: () => listItemsByStatus("READY", 1, 200),
    ...COMMON_Q,
  });

  const muUpdateItems = useMutation({
    mutationFn: ({ itemIds, status }: { itemIds: string[]; status: ItemStatus }) =>
      updateItemsStatus(itemIds, status),
    onSuccess: () => {
      const hit = (k: string) => qc.invalidateQueries({ queryKey: ["items", k] });
      hit("NEW_ROWS");
      hit("PREPARING");
      hit("READY");
    },
  });


const voidFromKitchen = async (t: Ticket, qty?: number, reason?: string) => {
  const [ticketId] = t.itemIds;
  if (!ticketId) {
    toast.error("Thiếu ticketId để hủy");
    return;
  }

  const qtyToVoid = qty ?? t.items?.[0]?.qty ?? 1;
  const reasonMsg = reason?.trim() || "Bếp hủy món";

  try {
    await api.patch(`/kitchen/tickets/${ticketId}/cancel-from-kitchen`, {
      qtyToVoid,            // 👈 số lượng muốn hủy
      reason: reasonMsg,    // 👈 lý do
    });

    toast.success("Đã hủy món và thông báo cho thu ngân");

    // refetch 3 cột để thấy phần còn lại
    qc.invalidateQueries({ queryKey: ["items", "NEW_ROWS"] });
    qc.invalidateQueries({ queryKey: ["items", "PREPARING"] });
    qc.invalidateQueries({ queryKey: ["items", "READY"] });
  } catch (e: any) {
    const msg =
      e?.response?.data?.message ||
      e?.message ||
      "Không thể hủy món từ bếp";
    toast.error("Lỗi khi hủy món", { description: msg });
  }
};






// useEffect(() => {
//   if (!qNewRows.data) return;
//   // chỉ map thẳng từ API cho cột "Mới / Đã xác nhận"
//   setListNew(mapRowsToTickets(qNewRows.data));
// }, [qNewRows.data]);



useEffect(() => {
  setListCooking(mapRowsToTickets(qPreparingItems.data ?? []));
}, [qPreparingItems.data]);

useEffect(() => {
  setListReady(mapRowsToTickets(qReadyItems.data ?? []));
}, [qReadyItems.data]);
function removeOrderEverywhere(orderId: string) {
  setSocketTickets(prev => {
    const next = { ...prev };
    for (const [id, t] of Object.entries(prev)) {
      if (t.orderId === orderId) delete next[id];
    }
    return next;
  });

  setListNew(prev => prev.filter(t => t.orderId !== orderId));
  setListCooking(prev => prev.filter(t => t.orderId !== orderId));
  setListReady(prev => prev.filter(t => t.orderId !== orderId));

  setVoidedIds(prev => {
    const s = new Set(prev);
    // (không biết id nào cụ thể) -> giữ nguyên, không cần clear
    return s;
  });

  // Đồng bộ query 3 cột
  const hit = (k: string) => qc.invalidateQueries({ queryKey: ["items", k] });
  hit("NEW_ROWS"); hit("PREPARING"); hit("READY");
}


useEffect(() => {
  const s = getSocket();

  // --- join room & track connectivity ---
  const join = () => s.emit("room:join", "kitchen");
  const onConnect = () => {
    setSocketReady(true);
    join();
  };
  const onDisconnect = () => setSocketReady(false);
  s.connected ? onConnect() : s.once("connect", onConnect);
  s.on("disconnect", onDisconnect);

  // toast helpers
  const getTableName = (p: any) =>
    p?.tableName || p?.table?.name || p?.table || p?.order?.table?.name || "—";

  // --- chuẩn hoá payload & nhét từng ticket vào state socketTickets ---
  const pushTicketPayload = (p: any) => {
  const items = Array.isArray(p?.items) ? p.items : [];
  if (!items.length) return;

  const batchId = p?.batchId;
  if (batchId && processedBatchIdsRef.current.has(batchId)) return;
  if (batchId) processedBatchIdsRef.current.add(batchId);

  const createdTs = Date.parse(p?.createdAt || "") || Date.now();
  const table = getTableName(p);

  const createdIds: string[] = [];

  setSocketTickets(prev => {
    const next = { ...prev };

    for (const raw of items) {
      const orderItemId = raw?.orderItemId as string | undefined;

      let ticketIdResolved =
        (raw as any)?.ticketId ??
        (raw as any)?.id ??
        `${p?.orderId ?? "order"}:${orderItemId ?? "item"}:${batchId ?? createdTs}`;

      if (next[ticketIdResolved]) {
        ticketIdResolved = `${ticketIdResolved}:${createdTs}`;
      }

      const qty = Math.max(1, Number(raw?.qty) || 1);
      const name = raw?.name ?? "";
      const menuItemId = raw?.menuItemId ?? raw?.menu_item_id ?? "unknown";
      const note = raw?.note ?? p.note ?? undefined;   // 👈 CHUYỂN VÀO TRONG VÒNG FOR

      next[ticketIdResolved] = {
        id: ticketIdResolved,
        orderId: p.orderId,
        table,
        createdAt: p.createdAt
          ? new Date(p.createdAt).toLocaleString()
          : new Date().toLocaleString(),
        createdTs,
        items: [{ menuItemId, name, qty }],
        itemIds: [ticketIdResolved],
        priority: p.priority ? "high" : "normal",
        note,                            // 👈 dùng note ở đây
        justArrived: true,
      };

      createdIds.push(ticketIdResolved);
    }

    return next;
  });

  setTimeout(() => {
    setSocketTickets(prev => {
      const next = { ...prev };
      for (const id of createdIds) {
        if (next[id]) next[id] = { ...next[id], justArrived: false };
      }
      return next;
    });
  }, 15_000);

  qc.invalidateQueries({ queryKey: ["items", "NEW_ROWS"] });

  toast.success(p?.priority ? "Có order ưu tiên" : "Phiếu mới", {
    description: `Bàn ${table}`,
    duration: 3500,
  });
};


  // --- listen Notify từ thu ngân ---
  const onSingle = (p: any) => pushTicketPayload(p);
  const onBatch = (p: any) => pushTicketPayload(p);
  const onKitchenNotify = (p: any) => pushTicketPayload(p);
  s.on("cashier:notify_item", onSingle);
  s.on("cashier:notify_items", onBatch);
  s.on("kitchen:notify", onKitchenNotify);



const onVoidedFromNewGateway = (p: {
  orderId: string;
  menuItemId: string;
  qty: number;
  reason?: string;
  by?: string;
}) => {
  console.log("[kitchen:void_synced] payload = ", p);

  const by = p.by ?? "cashier";

  // 🔥 Nếu chính bếp bấm "Hủy món" thì bỏ qua
  // UI bếp đã được cập nhật bằng refetch trong voidFromKitchen()
  if (by === "kitchen") {
    return;
  }

  const applyVoid = (
    setter: (updater: (prev: Ticket[]) => Ticket[]) => void
  ) => {
    setter((prev) => {
      const next: Ticket[] = [];

      for (const t of prev) {
        const it = t.items[0];

        if (t.orderId === p.orderId && it?.menuItemId === p.menuItemId) {
          const originalQty = it.qty;
          const cancelled = Math.min(originalQty, p.qty);
          const remain = originalQty - cancelled;

          const voidTicketId = `${t.id}:void:${Date.now()}`;

          const voidTicket: Ticket = {
            ...t,
            id: voidTicketId,
            items: [{ ...it, qty: cancelled }],
          };
          next.push(voidTicket);

          setVoidedIds((old) => {
            const s = new Set(old);
            s.add(voidTicketId);
            return s;
          });

          if (remain > 0) {
            const remainTicket: Ticket = {
              ...t,
              items: [{ ...it, qty: remain }],
            };
            next.push(remainTicket);
          }
        } else {
          next.push(t);
        }
      }

      return next;
    });
  };

  // ❗ Quan trọng: huỷ từ cashier/waiter CHỈ tác động tới PENDING/CONFIRMED
  // nên chỉ apply cho listNew, KHÔNG động vào listCooking/listReady
  applyVoid(setListNew);

  const who = by === "kitchen" ? "Bếp" : "Thu ngân";
  toast.error(`${who} đã hủy món`, {
    description: p.reason || undefined,
  });
};





  s.on("kitchen:void_synced", onVoidedFromNewGateway);

  // --- thay đổi trạng thái ticket (PREPARING/READY/SERVED) ---
  const onStatusChanged = (_p: any) => {
    qc.invalidateQueries({ queryKey: ["items", "NEW_ROWS"] });
    qc.invalidateQueries({ queryKey: ["items", "PREPARING"] });
    qc.invalidateQueries({ queryKey: ["items", "READY"] });
  };
  s.on("kitchen:ticket_status_changed", onStatusChanged);

  // cleanup
  return () => {
    s.off("cashier:notify_item", onSingle);
    s.off("cashier:notify_items", onBatch);
    s.off("kitchen:notify", onKitchenNotify);

    s.off("kitchen:void_synced", onVoidedFromNewGateway);
    s.off("kitchen:ticket_status_changed", onStatusChanged);
    s.off("connect", onConnect);
    s.off("disconnect", onDisconnect);
  };
}, [qc]);



useEffect(() => {
  // API ids = kitchen_tickets.id
  const apiIds = new Set((qNewRows.data ?? []).map((r: ApiOrderItemExt) => r.id));

  const keepAlso = new Set<string>([
    ...Array.from(voidedIds),
    ...Array.from(hiddenIds),
  ]);

  setSocketTickets(prev => {
    const next: typeof prev = {};
    for (const [id, t] of Object.entries(prev)) {
      if (apiIds.has(id) || keepAlso.has(id)) next[id] = t;
    }
    const same =
      Object.keys(next).length === Object.keys(prev).length &&
      Object.keys(next).every(k => prev[k] === next[k]);
    return same ? prev : next;
  });
}, [qNewRows.data, voidedIds, hiddenIds]);


useEffect(() => {
  if (!qNewRows.data) return;

  const apiTickets = mapRowsToTickets(qNewRows.data);

  setListNew(prev => {
    const apiIds = new Set(apiTickets.map(t => t.id));

    // giữ lại các ticket đã bị void (voidedIds) mà API không trả nữa
    const preservedVoided = prev.filter(
      t => voidedIds.has(t.id) && !apiIds.has(t.id)
    );

    // ticket thường lấy từ API, ticket đã void lấy từ prev
    return [...preservedVoided, ...apiTickets];
  });
}, [qNewRows.data, voidedIds]);


  /* =============== Actions =============== */
  const moveWholeRow = async (orderItemId: string, to: ItemStatus, okMsg: string) => {
    try {
      await muUpdateItems.mutateAsync({ itemIds: [orderItemId], status: to });
      toast.success(okMsg);
    } catch (e: any) {
      toast.error(`Không thể chuyển ${to}`, { description: e?.message });
    }
  };

 const startCooking = async (t: Ticket) => {
  const [ticketId] = t.itemIds;
  if (!ticketId) return toast.error("Thiếu ticketId");
  await moveWholeRow(ticketId, "PREPARING", "Bắt đầu nấu (toàn bộ)");
};

  const markReady = async (t: Ticket) => {
    const [orderItemId] = t.itemIds;
    await moveWholeRow(orderItemId, "READY", "Đã nấu xong (toàn bộ)");
  };
  const serve = async (t: Ticket) => {
    const [orderItemId] = t.itemIds;
    await moveWholeRow(orderItemId, "SERVED", "Đã cung ứng (toàn bộ)");
  };
  const clearTicket = (t: Ticket) => {
    setHiddenIds(prev => {
      const s = new Set(prev);
      s.add(t.id);
      return s;
    });
    // Ẩn khỏi 3 list hiện hành
    setListNew(prev => prev.filter(x => x.id !== t.id));
    setListCooking(prev => prev.filter(x => x.id !== t.id));
    setListReady(prev => prev.filter(x => x.id !== t.id));
    // KHÔNG xóa khỏi socketTickets (để vẫn khôi phục được nếu cần)
  };
  /* =============== UI =============== */
  return (
    <div className="flex h-screen flex-col bg-[#0B3C86] text-white">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-lg font-semibold">Màn Bếp</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="gap-2"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["items", "NEW_ROWS"] });
              qc.invalidateQueries({ queryKey: ["items", "PREPARING"] });
              qc.invalidateQueries({ queryKey: ["items", "READY"] });
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-3">
        {/* NEW */}
        <div className="rounded-2xl bg-white p-3 text-slate-900 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold text-[#0B3C86]">Mới / Đã xác nhận</div>
            <Badge variant="secondary">{listNew.length}</Badge>
          </div>
          <div className="h[calc(100vh-180px)] md:h-[calc(100vh-180px)]">
            {qNewRows.isLoading && listNew.length === 0 ? (
              <EmptyState text="Đang tải..." />
            ) : listNew.length === 0 ? (
              <EmptyState text="Chưa có phiếu mới" />
            ) : (
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {listNew.map((t) => (
                    <TicketCard
                      key={t.id}
                      t={t}
                      variant="new"
                      voided={voidedIds.has(t.id)}
                      onStart={startCooking}
                      onClear={clearTicket} 
                       onVoidFromKitchen={openVoidModal}
                     onDelete={(t) => {
  // không xóa khỏi socketTickets để lần sau vẫn khôi phục nếu muốn;
  // chỉ đánh dấu hidden để ẩn khỏi 3 list hiện hành
  setHiddenIds(prev => {
    const s = new Set(prev);
    s.add(t.id);
    return s;
  });
  setListNew(prev => prev.filter(x => x.id !== t.id));
  setListCooking(prev => prev.filter(x => x.id !== t.id));
  setListReady(prev => prev.filter(x => x.id !== t.id));
}}

                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* PREPARING */}
        <div className="rounded-2xl bg-white p-3 text-slate-900 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold text-[#0B3C86]">Đang chế biến</div>
            <Badge variant="secondary">{(listCooking ?? []).length}</Badge>
          </div>
          <div className="h[calc(100vh-180px)] md:h-[calc(100vh-180px)]">
            {qPreparingItems.isLoading ? (
              <EmptyState text="Đang tải..." />
            ) : (listCooking ?? []).length === 0 ? (
              <EmptyState text="Chưa có món đang nấu" />
            ) : (
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {listCooking.map((t) => (
                  <TicketCard
  key={t.id}
  t={t}
  variant="preparing"
  voided={voidedIds.has(t.id)}
  onComplete={markReady}
  onClear={clearTicket}
  onDelete={(t) => {
  // không xóa khỏi socketTickets để lần sau vẫn khôi phục nếu muốn;
  // chỉ đánh dấu hidden để ẩn khỏi 3 list hiện hành
  setHiddenIds(prev => {
    const s = new Set(prev);
    s.add(t.id);
    return s;
  });
  setListNew(prev => prev.filter(x => x.id !== t.id));
  setListCooking(prev => prev.filter(x => x.id !== t.id));
  setListReady(prev => prev.filter(x => x.id !== t.id));
}}

/>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* READY */}
        <div className="rounded-2xl bg-white p-3 text-slate-900 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold text-[#0B3C86]">Sẵn sàng cung ứng</div>
            <Badge variant="secondary">{(listReady ?? []).length}</Badge>
          </div>
          <div className="h[calc(100vh-180px)] md:h-[calc(100vh-180px)]">
            {qReadyItems.isLoading ? (
              <EmptyState text="Đang tải..." />
            ) : (listReady ?? []).length === 0 ? (
              <EmptyState text="Chưa có món sẵn sàng" />
            ) : (
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {listReady.map((t) => (
                    <TicketCard
  key={t.id}
  t={t}
  variant="ready"
  voided={voidedIds.has(t.id)}
  onServe={serve}
  onClear={clearTicket}
 onDelete={(t) => {
  // không xóa khỏi socketTickets để lần sau vẫn khôi phục nếu muốn;
  // chỉ đánh dấu hidden để ẩn khỏi 3 list hiện hành
  setHiddenIds(prev => {
    const s = new Set(prev);
    s.add(t.id);
    return s;
  });
  setListNew(prev => prev.filter(x => x.id !== t.id));
  setListCooking(prev => prev.filter(x => x.id !== t.id));
  setListReady(prev => prev.filter(x => x.id !== t.id));
}}

/>

                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
      {voidTicket && (
  <Dialog open={voidModalOpen} onOpenChange={setVoidModalOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Hủy món từ bếp</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        <div className="text-sm">
          <div>Bàn: <span className="font-semibold">{voidTicket.table}</span></div>
          <div>
            Món:{" "}
            <span className="font-semibold">
              {voidTicket.items[0]?.name} (x{voidTicket.items[0]?.qty})
            </span>
          </div>
        </div>

        {/* form nhỏ: số lượng + lý do */}
        <VoidForm
          maxQty={voidTicket.items[0]?.qty ?? 1}
          onCancel={() => {
            setVoidModalOpen(false);
            setVoidTicket(null);
          }}
          onConfirm={handleConfirmVoid}
        />
      </div>
    </DialogContent>
  </Dialog>
)}

    </div>
  );
}
function VoidForm({
  maxQty,
  onCancel,
  onConfirm,
}: {
  maxQty: number;
  onCancel: () => void;
  onConfirm: (qty: number, reason: string) => void;
}) {
  const [qty, setQty] = useState<number>(maxQty || 1);
  const [reason, setReason] = useState<string>("Bếp hủy món");

  const handleSubmit = () => {
    const safeQty = Math.max(1, Math.min(maxQty || 1, qty || 1));
    onConfirm(safeQty, reason);
  };

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Số lượng cần hủy</label>
        <Input
          type="number"
          min={1}
          max={maxQty || 1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value) || 1)}
        />
        <p className="text-xs text-muted-foreground">
          Tối đa: {maxQty} phần.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Lý do bếp hủy</label>
        <Textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="VD: Khách đổi món, hết nguyên liệu..."
        />
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel}>
          Đóng
        </Button>
        <Button variant="destructive" onClick={handleSubmit}>
          Xác nhận hủy
        </Button>
      </DialogFooter>
    </>
  );
}
