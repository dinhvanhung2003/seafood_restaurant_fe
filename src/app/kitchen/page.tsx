"use client";

import { useEffect, useMemo, useState } from "react";
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

/* ================= Types (ITEM-LEVEL) ================= */
type ItemStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "CANCELLED";

type ApiOrderItemExt = {
  id: string; // orderItemId
  quantity: number;
  status: ItemStatus;
  createdAt: string;
  batchId?: string | null;
  menuItem: { id: string; name: string };
  order: { id: string; table: { id: string; name: string } };
};

export type Ticket = {
  id: string; // ticket id (ưu tiên batchId; nếu không có thì tự sinh)
  orderId: string;
  table: string;
  createdAt: string;
  items: { name: string; qty: number }[];
  itemIds: string[]; // danh sách orderItemId của ticket
  priority?: "high" | "normal";
  note?: string;
};

/* ================= API helpers (ITEM-LEVEL) ================= */
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
  onStart?: (t: Ticket) => void; // -> PREPARING
  onComplete?: (t: Ticket) => void; // -> READY
  onServe?: (t: Ticket) => void; // -> SERVED
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
            Bắt đầu nấu
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

/* ================= Merge/Reconcile helpers ================= */



function rowsToSingleItemTickets(rows: ApiOrderItemExt[]): Ticket[] {
  return rows
    .map((r) => ({
      id: r.id, // MỖI ITEM = 1 TICKET, id = orderItemId
      orderId: r.order.id,
      table: r.order.table?.name ?? "—",
      createdAt: new Date(r.createdAt).toLocaleString(),
      items: [{ name: r.menuItem.name, qty: r.quantity }],
      itemIds: [r.id],
    }))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}


function mergeTickets(a: Ticket, b: Ticket): Ticket {
  const map = new Map<string, { name: string; qty: number }>();
  a.itemIds.forEach((id, i) => map.set(id, a.items[i]));
  b.itemIds.forEach((id, i) => !map.has(id) && map.set(id, b.items[i]));
  const itemIds = Array.from(map.keys());
  const items = itemIds.map((id) => map.get(id)!);
  return {
    ...a,
    ...b,
    itemIds,
    items,
    createdAt: a.createdAt || b.createdAt,
  };
}

function groupToTickets(rows: ApiOrderItemExt[]): Ticket[] {
  const byKey = new Map<string, Ticket>();
  for (const r of rows) {
    const key = r.batchId || r.id;
    const ex = byKey.get(key);
    if (!ex) {
      byKey.set(key, {
        id: key,
        orderId: r.order.id,
        table: r.order.table?.name ?? "—",
        createdAt: new Date(r.createdAt).toLocaleString(),
        items: [{ name: r.menuItem.name, qty: r.quantity }],
        itemIds: [r.id],
      });
    } else {
      ex.items.push({ name: r.menuItem.name, qty: r.quantity });
      ex.itemIds.push(r.id);
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

function reconcileNewTickets(
  apiNewRows: ApiOrderItemExt[],
  socketMap: Record<string, Ticket>,
): Ticket[] {
  // 1) Socket tickets (đã là item-level, giữ nguyên)
  const socketTickets = Object.values(socketMap);

  // 2) Những itemId đã cover bởi socket
  const covered = new Set<string>();
  for (const t of socketTickets) t.itemIds.forEach((id) => covered.add(id));

  // 3) Phần còn lại từ API (chưa có trên socket) -> chuyển MỖI ITEM = 1 TICKET
  const leftovers = apiNewRows.filter((r) => !covered.has(r.id));
  const apiTickets = rowsToSingleItemTickets(leftovers);

  // 4) Hiển thị (mới nhất lên trước)
  return [...socketTickets, ...apiTickets].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}


/* ================= Main Screen (ITEM-LEVEL) ================= */
export default function KitchenScreen() {
  const qc = useQueryClient();

  // tickets đến từ socket (map để merge), và danh sách NEW đã reconcile
  const [socketTickets, setSocketTickets] = useState<Record<string, Ticket>>({});
  const [listNew, setListNew] = useState<Ticket[]>([]);

  // Polling (phòng socket rớt)
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

  // Mutations — đổi trạng thái theo itemIds
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

  /* ================= Socket ================= */
  useEffect(() => {
    (async () => {
      // Boot Socket.IO server (Next API route)
      await fetch("/api/socket").catch(() => {});
    })();

    const s = getSocket();

    // Debug logs (hữu ích khi deploy)
    s.on("connect", () => console.log("[kitchen] socket connected:", s.id));
    s.on("disconnect", (reason) => console.warn("[kitchen] socket disconnect:", reason));
    s.on("connect_error", (err) => console.error("[kitchen] connect_error:", err?.message || err));
    s.io.on("reconnect_attempt", (n) => console.log("[kitchen] reconnect attempt:", n));
    s.io.on("reconnect_error", (e) => console.warn("[kitchen] reconnect error:", e?.message || e));

    // Join room sau khi connect để chắc ăn
    const doJoin = () => s.emit("room:join", "kitchen");
    if (s.connected) doJoin(); else s.once("connect", doJoin);

    const burstRefetch = () => {
      qc.invalidateQueries({ queryKey: ["items", "NEW_ROWS"] });
      qc.invalidateQueries({ queryKey: ["items", "PREPARING"] });
      qc.invalidateQueries({ queryKey: ["items", "READY"] });
    };

    // Nhận 1 payload và thêm/merge ticket
    const pushTicket = (p: any) => {
  console.log("[kitchen] recv payload:", p);

  const items = Array.isArray(p?.items) ? p.items : [];
  if (!items.length) return;

  // Tạo một khóa “lần gửi” duy nhất (ưu tiên batchId từ POS; fallback createdAt millisecond; thêm nonce)
  const sendKey =
    p.batchId ||
    p.notifyId ||
    (typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString()) ||
    `${Date.now()}`;
  const nonce = Math.random().toString(36).slice(2, 7);

  // Fan-out: mỗi item = 1 ticket
  setSocketTickets((prev) => {
    const next = { ...prev };
    items.forEach((it: any, idx: number) => {
      const orderItemId = it?.orderItemId;
      if (!orderItemId) return;

      // ⚠️ ID duy nhất theo từng item + từng lần gửi
      // ví dụ:  <batch-or-createdAt>:<orderItemId>:<idx>:<nonce>
      const ticketId = `${sendKey}:${orderItemId}:${idx}:${nonce}`;

      next[ticketId] = {
        id: ticketId,
        orderId: p.orderId,
        table: p.tableName ?? "—",
        createdAt: p.createdAt ?? new Date().toLocaleString(),
        items: [{ name: it.name, qty: it.qty }], // chỉ 1 item trong ticket
        itemIds: [orderItemId],
        priority: p.priority ? "high" : "normal",
        note: p.note ?? undefined,
      };
    });
    return next;
  });
};


    // Handlers cho 2 loại event
    const handleSingle = (p: any) => {
      pushTicket(p);
      burstRefetch();
    };
    const handleBatch = (p: any) => {
      pushTicket(p);
      burstRefetch();
    };

    // Đăng ký
    s.on("cashier:notify_item", handleSingle);
    s.on("cashier:notify_items", handleBatch);

    // WS rớt: refetch bù vài nhịp
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

    // Cleanup
    return () => {
      s.off("cashier:notify_item", handleSingle);
      s.off("cashier:notify_items", handleBatch);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onDisconnect);
    };
  }, [qc]);

  // Reconcile NEW mỗi khi API hoặc socket thay đổi
  useEffect(() => {
    setListNew(reconcileNewTickets(qNewRows.data ?? [], socketTickets));
  }, [qNewRows.data, socketTickets]);

  // Dữ liệu cho PREPARING / READY
  const listCooking = useMemo(
  () => rowsToSingleItemTickets(qPreparingItems.data ?? []),
  [qPreparingItems.data],
);

const listReady = useMemo(
  () => rowsToSingleItemTickets(qReadyItems.data ?? []),
  [qReadyItems.data],
);


  // Handlers — item-level
  const startCooking = async (t: Ticket) => {
    if (!t.itemIds?.length) return toast.error("Thiếu itemIds để bắt đầu nấu");
    try {
      await muUpdateItems.mutateAsync({ itemIds: t.itemIds, status: "PREPARING" });
      setSocketTickets((prev) => {
        const { [t.id]: _, ...rest } = prev;
        return rest;
      });
      toast.success(`Bắt đầu nấu • ${t.table}`);
    } catch (e: any) {
      toast.error("Không thể chuyển PREPARING", { description: e?.message });
    }
  };

  const markReady = async (t: Ticket) => {
    if (!t.itemIds?.length) return;
    try {
      await muUpdateItems.mutateAsync({ itemIds: t.itemIds, status: "READY" });
      toast.success(`Đã nấu xong • ${t.table}`);
    } catch (e: any) {
      toast.error("Không thể chuyển READY", { description: e?.message });
    }
  };

  const serve = async (t: Ticket) => {
    if (!t.itemIds?.length) return;
    try {
      await muUpdateItems.mutateAsync({ itemIds: t.itemIds, status: "SERVED" });
      toast.success(`Đã cung ứng • ${t.table}`);
    } catch (e: any) {
      toast.error("Không thể chuyển SERVED", { description: e?.message });
    }
  };

  /* ================= UI ================= */
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
            <div className="text-base font-semibold text-[#0B3C86]">
              Mới / Đã xác nhận
            </div>
            <Badge variant="secondary">{listNew.length}</Badge>
          </div>
          <div className="h-[calc(100vh-180px)]">
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
          <div className="h-[calc(100vh-180px)]">
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
            <div className="text-base font-semibold text-[#0B3C86]">
              Sẵn sàng cung ứng
            </div>
            <Badge variant="secondary">{(listReady ?? []).length}</Badge>
          </div>
          <div className="h-[calc(100vh-180px)]">
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
