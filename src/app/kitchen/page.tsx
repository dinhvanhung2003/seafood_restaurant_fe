"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
      const uiId = r.orderItemId ?? r.id; // ✅ chốt dùng orderItemId
      return {
        id: uiId,
        orderId: r.order.id,
        table: r.order?.table?.name ?? "—",
        createdAt: new Date(r.createdAt).toLocaleString(),
        createdTs: ts,
        items: [{ menuItemId: r.menuItem.id, name: r.menuItem.name, qty: r.quantity }],
        itemIds: [uiId], // ✅ đồng nhất
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
  onClear
}: {
  t: Ticket;
  variant: "new" | "preparing" | "ready";
  voided?: boolean;
  onStart?: (t: Ticket) => void;
  onComplete?: (t: Ticket) => void;
  onServe?: (t: Ticket) => void;
  onDelete?: (t: Ticket) => void;
  onClear?: (t: Ticket) => void;
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
              <Button size="sm" className="h-8" onClick={() => onStart?.(t)}>
                <ChefHat className="mr-2 h-4 w-4" />
                Bắt đầu nấu (toàn bộ)
              </Button>
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


  /* =============== Socket =============== */
// ===== helper: trừ dồn theo menuItemId, xoá card nếu qty về 0 =====
function consumeByMenu(tickets: Ticket[], menuItemId: string, qty: number): { tickets: Ticket[]; remain: number } {
  if (qty <= 0) return { tickets, remain: 0 };

  let need = qty;
  const next = tickets.map(t => {
    const items = t.items.map(it => {
      if (it.menuItemId !== menuItemId) return it;
      const take = Math.min(it.qty, need);
      need -= take;
      return { ...it, qty: it.qty - take };
    }).filter(it => it.qty > 0);
    return { ...t, items };
  }).filter(t => t.items.length > 0);

  return { tickets: next, remain: need };
}
useEffect(() => {
  setListNew(reconcileNewTickets(qNewRows.data ?? [], socketTickets, voidedIds, hiddenIds));
}, [qNewRows.data, socketTickets, voidedIds, hiddenIds]);


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

  const JUST_MS = 15_000;

  // toast helpers
  const summarize = (p: any) => {
    const items = Array.isArray(p?.items) ? p.items : [];
    const head = items.slice(0, 3).map((it: any) => `${it.name} x${it.qty}`).join(" • ");
    return head + (items.length > 3 ? ` +${items.length - 3}` : "");
  };
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

  setSocketTickets(prev => {
    const next = { ...prev };
    for (const raw of items) {
      const ticketId = raw?.ticketId as string | undefined;
     const orderItemId = raw?.orderItemId as string | undefined;
// ✅ dùng orderItemId làm id UI
const idForUI = orderItemId ?? raw?.ticketId;
      if (!idForUI) continue;

      const qty = Math.max(1, Number(raw?.qty) || 1);
      const name = raw?.name ?? "";
      const menuItemId = raw?.menuItemId ?? raw?.menu_item_id; // BE phải gửi

      next[idForUI] = {
        id: idForUI,
        orderId: p.orderId,
        table,
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleString() : new Date().toLocaleString(),
        createdTs,
        items: [{ menuItemId, name, qty }],
     itemIds: [idForUI],
        priority: p.priority ? "high" : "normal",
        note: p.note ?? undefined,
        justArrived: true,
      };
    }
    return next;
  });

  setTimeout(() => {
    setSocketTickets(prev => {
      const next = { ...prev };
      for (const raw of items) {
        const idForUI = raw?.ticketId ?? raw?.orderItemId;
        if (idForUI && next[idForUI]) next[idForUI] = { ...next[idForUI], justArrived: false };
      }
      return next;
    });
  }, JUST_MS);

  qc.invalidateQueries({ queryKey: ["items", "NEW_ROWS"] });
  toast.success(p?.priority ? "Có order ưu tiên" : "Phiếu mới", { description: `Bàn ${table}`, duration: 3500 });
};


  // --- listen Notify từ thu ngân ---
  const onSingle = (p: any) => pushTicketPayload(p);
  const onBatch  = (p: any) => pushTicketPayload(p);
  const onKitchenNotify = (p: any) => pushTicketPayload(p);
  s.on("cashier:notify_item", onSingle);
  s.on("cashier:notify_items", onBatch);
  s.on("kitchen:notify", onKitchenNotify);

  // --- hủy ticket: toàn bộ (ticketIds) & một phần (items[{menuItemId, qty}]) ---
// const onVoided = (p: {
//   orderId: string;
//   ticketIds?: string[]; // === danh sách orderItemId ===
//   tableName?: string;
//   by?: string;
//   items?: Array<{ menuItemId: string; qty: number; reason?: string }>;
// }) => {
//   // ✅ FULL cancel theo ticketIds (key UI = orderItemId)
//   if (p.ticketIds?.length) {
//     const ids = new Set(p.ticketIds);
//     setSocketTickets(prev => {
//       const next = { ...prev };
//       for (const id of ids) delete next[id];
//       return next;
//     });
//     setListNew(prev => prev.filter(t => !ids.has(t.id)));
//     setListCooking(prev => prev.filter(t => !ids.has(t.id)));
//     setListReady(prev => prev.filter(t => !ids.has(t.id)));
//   }

//   // ✅ PARTIAL cancel theo menuItemId/qty (giữ nguyên logic bạn đã có)
//   const items = p.items ?? [];
//   if (items.length) {
//     setListNew(prev => {
//       let cur = prev;
//       const remain = new Map<string, number>();
//       for (const { menuItemId, qty } of items) {
//         const res = consumeByMenu(cur, menuItemId, qty);
//         cur = res.tickets;
//         if (res.remain > 0) remain.set(menuItemId, (remain.get(menuItemId) ?? 0) + res.remain);
//       }
//       setListCooking(prevCook => {
//         let curCook = prevCook;
//         const remain2 = new Map(remain);
//         for (const [menuItemId, qtyLeft] of remain2) {
//           const res = consumeByMenu(curCook, menuItemId, qtyLeft);
//           curCook = res.tickets;
//           remain2.set(menuItemId, res.remain);
//         }
//         setListReady(prevReady => {
//           let curReady = prevReady;
//           for (const [menuItemId, qtyLeft] of remain2) {
//             if (qtyLeft > 0) curReady = consumeByMenu(curReady, menuItemId, qtyLeft).tickets;
//           }
//           return curReady;
//         });
//         return curCook;
//       });
//       return cur;
//     });
//   }

//   // đồng bộ query
//   const hit = (k: string) => qc.invalidateQueries({ queryKey: ["items", k] });
//   hit("NEW_ROWS"); hit("PREPARING"); hit("READY");
// };







  
const onVoided = (p: {
  orderId: string;
  ticketIds?: string[]; // == danh sách orderItemId (id UI)
  tableName?: string;
  by?: string;
  items?: Array<{ menuItemId: string; qty: number; reason?: string }>;
}) => {
  // ✅ FULL cancel: chỉ mark voided, KHÔNG xóa khỏi state
  if (p.ticketIds?.length) {
    setVoidedIds(prev => {
      const s = new Set(prev);
      for (const id of p.ticketIds!) s.add(id);
      return s;
    });
    // 👉 Không delete khỏi socketTickets/listNew/listCooking/listReady
  }

  // ✅ PARTIAL giữ nguyên logic trừ dồn như bạn đang có
  const items = p.items ?? [];
  if (items.length) {
    // ... (giữ nguyên consumeByMenu cho NEW / COOKING / READY)
  }

  // Đồng bộ query
  const hit = (k: string) => qc.invalidateQueries({ queryKey: ["items", k] });
  hit("NEW_ROWS"); hit("PREPARING"); hit("READY");
};


  s.on("kitchen:tickets_voided", onVoided);

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
    s.off("kitchen:tickets_voided", onVoided);
    s.off("kitchen:ticket_status_changed", onStatusChanged);
    s.off("connect", onConnect);
    s.off("disconnect", onDisconnect);
  };
}, [qc]);




  /* =============== Merge NEW tickets =============== */
// useEffect(() => {
//   const apiIds = new Set(
//     (qNewRows.data ?? []).map((r: ApiOrderItemExt) => r.orderItemId ?? r.id)
//   );

//   setSocketTickets(prev => {
//     const next: typeof prev = {};
//     for (const [id, t] of Object.entries(prev)) {
//       if (apiIds.has(id)) next[id] = t; // chỉ giữ cái còn xuất hiện trong API
//     }
//     const same = Object.keys(next).length === Object.keys(prev).length &&
//                  Object.keys(next).every(k => prev[k] === next[k]);
//     return same ? prev : next;
//   });
// }, [qNewRows.data]); // ✅ chỉ 1 dep

useEffect(() => {
  const apiIds = new Set(
    (qNewRows.data ?? []).map((r: ApiOrderItemExt) => r.orderItemId ?? r.id)
  );

  // ⚠️ NEW: giữ thêm những id đã void/hide
  const keepAlso = new Set<string>([
    ...Array.from(voidedIds),
    ...Array.from(hiddenIds),
  ]);

  setSocketTickets(prev => {
    const next: typeof prev = {};
    for (const [id, t] of Object.entries(prev)) {
      if (apiIds.has(id) || keepAlso.has(id)) {
        next[id] = t; // ✅ giữ nếu còn trên API hoặc đã void/hide
      }
    }
    const same = Object.keys(next).length === Object.keys(prev).length &&
                 Object.keys(next).every(k => prev[k] === next[k]);
    return same ? prev : next;
  });
}, [qNewRows.data, voidedIds, hiddenIds]); // 👈 thêm deps





function reconcileNewTickets(apiNewRows: ApiOrderItemExt[], socketMap: Record<string, Ticket>, voidedIds: Set<string>, hiddenIds: Set<string>): Ticket[] {
  const out: Ticket[] = [];
  const covered = new Set<string>();
  const apiIds = new Set(apiNewRows.map((r) => r.orderItemId ?? r.id));

  for (const [id, t] of Object.entries(socketMap)) {
    if (hiddenIds.has(id)) continue;                    // ✅ bỏ nếu user đã ẩn
    if (apiIds.has(id) || voidedIds.has(id)) {
      out.push(t); covered.add(id);
    }
  }
  for (const r of apiNewRows) {
    const id = r.orderItemId ?? r.id;
    if (covered.has(id) || hiddenIds.has(id)) continue; // ✅
    out.push(mapRowsToTickets([r])[0]!);
  }
  return out.sort((a, b) => b.createdTs - a.createdTs);
}


// useEffect(() => {
//   setListNew(reconcileNewTickets(qNewRows.data ?? [], socketTickets, voidedIds, hiddenIds));
// }, [qNewRows.data, socketTickets, voidedIds, hiddenIds]);


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
    const [orderItemId] = t.itemIds;
    if (!orderItemId) return toast.error("Thiếu itemIds");
    await moveWholeRow(orderItemId, "PREPARING", "Bắt đầu nấu (toàn bộ)");
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
    </div>
  );
}
