"use client";

import { useEffect, useMemo, useState,useRef } from "react";
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
  Menu as MenuIcon,
  UtensilsCrossed,
  Clock4,
  ChefHat,
  CheckCircle2,
  Truck,
  RotateCcw,
} from "lucide-react";
import api from "@/lib/axios";

/* =============== Types (ROW-LEVEL, GIỮ NGUYÊN QTY) =============== */
type ItemStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "CANCELLED";

// Hàng từ BE: mỗi row = 1 "order item" với quantity n
export type ApiOrderItemExt = {
  id: string; // orderItemId (ROW-LEVEL)
  quantity: number;
  status: ItemStatus;
  createdAt: string;
  batchId?: string | null;
  menuItem: { id: string; name: string };
  order: { id: string; table: { id: string; name: string } };
};

// Ticket hiển thị trên UI: GIỮ QTY NHƯ THU NGÂN GỬI
export type Ticket = {
  id: string; // = orderItemId (ROW-LEVEL — KHÔNG XÉ LẺ)
  orderId: string;
  table: string;
  createdAt: string;
  createdTs: number; // để sort
  items: { name: string; qty: number }[]; // [{..., qty:n}] — GIỮ n
  itemIds: string[]; // [orderItemId]
  priority?: "high" | "normal";
  note?: string;
};

/* =============== API helpers =============== */
async function listItemsByStatus(
  status: ItemStatus,
  page = 1,
  limit = 200,
): Promise<ApiOrderItemExt[]> {
  const res = await api.get("/orderitems", { params: { status, page, limit } });
  return (res.data?.data ?? res.data) as ApiOrderItemExt[];
}

async function updateItemsStatus(itemIds: string[], status: ItemStatus) {
  const res = await api.patch("/orderitems/status", { itemIds, status });
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
  onStart,
  onComplete,
  onServe,
}: {
  t: Ticket;
  variant: "new" | "preparing" | "ready";
  onStart?: (t: Ticket) => void; // -> PREPARING (toàn bộ row)
  onComplete?: (t: Ticket) => void; // -> READY (toàn bộ row)
  onServe?: (t: Ticket) => void; // -> SERVED (toàn bộ row)
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
            <div className="truncate">
              {i + 1}. {it.name}
            </div>
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
    </div>
  );
}

/* =============== Helpers (GIỮ QTY, KHÔNG XÉ LẺ/Không gộp lại) =============== */

// Map 1 row -> 1 ticket, GIỮ quantity như BE/cashier gửi
function mapRowsToTickets(rows: ApiOrderItemExt[]): Ticket[] {
  return rows
    .map((r) => {
      const ts = Date.parse(r.createdAt) || Date.now();
      const t: Ticket = {
        id: r.id, // ROW-LEVEL
        orderId: r.order.id,
        table: r.order.table?.name ?? "—",
        createdAt: new Date(r.createdAt).toLocaleString(),
        createdTs: ts,
        items: [{ name: r.menuItem.name, qty: r.quantity }], // GIỮ qty n
        itemIds: [r.id],
      };
      return t;
    })
    .sort((a, b) => b.createdTs - a.createdTs);
}




/* =============== Main =============== */
export default function KitchenScreen() {
  const qc = useQueryClient();

  // socket tickets keyed by orderItemId (ROW-LEVEL)
  const [socketTickets, setSocketTickets] = useState<Record<string, Ticket>>({});
  const [listNew, setListNew] = useState<Ticket[]>([]);
// đã xử lý batch nào (đến từ thu ngân) -> không xử lý lại
const processedBatchIdsRef = useRef<Set<string>>(new Set());

// số lượng đã hiển thị cho từng orderItemId (ROW-LEVEL)
const shownQtyRef = useRef<Record<string, number>>({});
// Reconcile NEW: ưu tiên socket (nếu có), KHÔNG xé lẻ, không cộng dồn
  // polling chống rớt socket
  const COMMON_Q = {
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    refetchInterval: 8_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  } as const;

  // NEW rows: PENDING + CONFIRMED
  const qNewRows = useQuery({
    queryKey: ["items", "NEW_ROWS"],
    queryFn: async () => {
      const pending = await listItemsByStatus("PENDING", 1, 200);
      const confirmed = await listItemsByStatus("CONFIRMED", 1, 200);
      return [...pending, ...confirmed];
    },
    ...COMMON_Q,
  });

  // PREPARING & READY
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

  // mutations — đổi trạng thái theo itemIds (BE theo row — BATCH)
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
function reconcileNewTickets(
  apiNewRows: ApiOrderItemExt[],
  socketMap: Record<string, Ticket>,
): Ticket[] {
  const out: Ticket[] = [];
  const covered = new Set<string>();

  // ưu tiên socket nếu còn tồn tại ở API
  const apiIds = new Set(apiNewRows.map((r) => r.id));
  for (const [orderItemId, t] of Object.entries(socketMap)) {
    if (apiIds.has(orderItemId)) {
      out.push(t);
      covered.add(orderItemId);
    }
  }

  // phần còn lại từ API nhưng chỉ lấy những dòng có quantity > shownQty
  for (const r of apiNewRows) {
    if (covered.has(r.id)) continue;
    const shown = shownQtyRef.current[r.id] ?? 0;
    if (r.quantity > shown) {
      out.push(mapRowsToTickets([r])[0]!);
    }
  }

  return out.sort((a, b) => b.createdTs - a.createdTs);
}
  /* =============== Socket =============== */
  useEffect(() => {
    (async () => {
      await fetch("/api/socket").catch(() => {});
    })();

    const s = getSocket();

    // debug
    s.on("connect", () => console.log("[kitchen] socket connected:", s.id));
    s.on("disconnect", (r) => console.warn("[kitchen] socket disconnect:", r));
    s.on("connect_error", (e) => console.error("[kitchen] connect_error:", e?.message || e));

    // join room sau khi connect
    const doJoin = () => s.emit("room:join", "kitchen");
    if (s.connected) doJoin();
    else s.once("connect", doJoin);

    const burstRefetch = () => {
      qc.invalidateQueries({ queryKey: ["items", "NEW_ROWS"] });
      qc.invalidateQueries({ queryKey: ["items", "PREPARING"] });
      qc.invalidateQueries({ queryKey: ["items", "READY"] });
    };

    // nhận payload từ thu ngân: GIỮ qty, không xé lẻ
    const pushTicket = (p: any) => {
  const items = Array.isArray(p?.items) ? p.items : [];
  if (!items.length) return;

  // 1) chống trùng batch
  const batchId = p?.batchId;
  if (batchId && processedBatchIdsRef.current.has(batchId)) return;
  if (batchId) processedBatchIdsRef.current.add(batchId);

  const createdTs = Date.parse(p.createdAt || "") || Date.now();

  for (const it of items) {
    const orderItemId = it?.orderItemId;
    if (!orderItemId) continue;

    const qtyIncoming = Math.max(1, Number(it?.qty) || 1);

    // 2) nếu qty nhận <= qty đã hiển thị -> bỏ qua (không “gọi” lại)
    const shown = shownQtyRef.current[orderItemId] ?? 0;
    if (qtyIncoming <= shown) continue;

    // 3) cập nhật ticket (giữ qty như cashier gửi) + cập nhật "đã hiển thị"
    const t: Ticket = {
      id: orderItemId,
      orderId: p.orderId,
      table: p.tableName ?? "—",
      createdAt: p.createdAt ?? new Date().toLocaleString(),
      createdTs,
      items: [{ name: it.name, qty: qtyIncoming }],
      itemIds: [orderItemId],
      priority: p.priority ? "high" : "normal",
      note: p.note ?? undefined,
    };

    shownQtyRef.current[orderItemId] = qtyIncoming;
    setSocketTickets(prev => ({ ...prev, [orderItemId]: t }));
  }
};

    const handleSingle = (p: any) => {
      pushTicket(p);
      burstRefetch();
    };
    const handleBatch = (p: any) => {
      pushTicket(p);
      burstRefetch();
    };

    s.on("cashier:notify_item", handleSingle);
    s.on("cashier:notify_items", handleBatch);

    const onDisconnect = () => {
      burstRefetch();
      let n = 0;
      const id = setInterval(() => {
        burstRefetch();
        if (++n >= 3) clearInterval(id);
      }, 3000);
    };
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onDisconnect);

    return () => {
      s.off("cashier:notify_item", handleSingle);
      s.off("cashier:notify_items", handleBatch);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onDisconnect);
    };
  }, [qc]);

  // Clean socketTickets khi NEW từ API thay đổi (chỉ giữ những orderItemId vẫn còn NEW)
  useEffect(() => {
    const apiNewSet = new Set((qNewRows.data ?? []).map((r) => r.id));
    setSocketTickets((prev) => {
      const next: typeof prev = {};
      for (const [orderItemId, t] of Object.entries(prev)) {
        if (apiNewSet.has(orderItemId)) next[orderItemId] = t;
      }
      return next;
    });
  }, [qNewRows.data]);

  // Reconcile NEW (ưu tiên socket)
  useEffect(() => {
    setListNew(reconcileNewTickets(qNewRows.data ?? [], socketTickets));
  }, [qNewRows.data, socketTickets]);

  // Dữ liệu cho PREPARING / READY (GIỮ qty, không xé lẻ)
  const listCooking = useMemo(
    () => mapRowsToTickets(qPreparingItems.data ?? []),
    [qPreparingItems.data],
  );
  const listReady = useMemo(
    () => mapRowsToTickets(qReadyItems.data ?? []),
    [qReadyItems.data],
  );

  // Helpers chuyển trạng thái cho TOÀN BỘ row (1 orderItemId)
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

  /* =============== UI =============== */
  return (
    <div className="flex h-screen flex-col bg-[#0B3C86] text-white">
      {/* Top bar */}
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
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
            <Volume2 />
          </Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
            <Settings />
          </Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
            <Bell />
          </Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
            <MenuIcon />
          </Button>
        </div>
      </div>

      {/* 3 cột trạng thái */}
      <div className="grid flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-3">
        {/* NEW */}
        <div className="rounded-2xl bg-white p-3 shadow-lg text-slate-900">
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
