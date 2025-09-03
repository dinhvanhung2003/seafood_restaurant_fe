"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import {
  Volume2, Settings, Bell, Menu, Clock4, UtensilsCrossed, CheckCircle2
} from "lucide-react";

// -------- Types --------
type TicketItem = { name: string; qty: number };
export type Ticket = {
  id: string;          // orderId-itemId (unique trong bếp)
  table: string;
  items: TicketItem[];
  createdAt: string;
  priority?: "high" | "normal";
  note?: string;  
};

// -------- Helpers --------
const LS_WAIT = "kitchen_waiting_v1";
const LS_DONE = "kitchen_done_v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// Upsert 1 ticket vào mảng, nếu đã có id thì gộp qty theo tên món
function upsertTicket(list: Ticket[], t: Ticket): Ticket[] {
  const idx = list.findIndex((x) => x.id === t.id);
  if (idx === -1) return [t, ...list];

  const cur = list[idx];
  // gộp items theo name
  const merged: Record<string, number> = {};
  [...cur.items, ...t.items].forEach((it) => {
    merged[it.name] = (merged[it.name] ?? 0) + it.qty;
  });
  const items = Object.entries(merged).map(([name, qty]) => ({ name, qty }));

  const next = [...list];
  next[idx] = { ...cur, items };
  return next;
}

// -------- UI --------
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
  onDone,
  onServe,
}: {
  t: Ticket;
  variant: "waiting" | "done";
  onDone?: (id: string) => void;
  onServe?: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{t.table}</div>
        <div className="flex items-center text-xs text-slate-500">
          <Clock4 className="mr-1 h-4 w-4" />
          {t.createdAt}
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

      <div className="mt-3 flex items-center gap-2">
        {variant === "waiting" ? (
          <Button size="sm" className="h-8" onClick={() => onDone?.(t.id)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Hoàn tất
          </Button>
        ) : (
          <Button size="sm" variant="secondary" className="h-8" onClick={() => onServe?.(t.id)}>
            Cung ứng
          </Button>
        )}
      </div>
    </div>
  );
}

// -------- Page --------
export default function KitchenScreen() {
  const [waiting, setWaiting] = useState<Ticket[]>([]);
  const [done, setDone] = useState<Ticket[]>([]);

  // 1) Khởi tạo từ localStorage
  useEffect(() => {
    setWaiting(load<Ticket[]>(LS_WAIT, []));
    setDone(load<Ticket[]>(LS_DONE, []));
  }, []);

  // 2) Persist khi thay đổi
  useEffect(() => save(LS_WAIT, waiting), [waiting]);
  useEffect(() => save(LS_DONE, done), [done]);

  // 3) Nhận socket từ thu ngân → add vào "waiting" (de-dup)
  useEffect(() => {
    let s: ReturnType<typeof getSocket> | null = null;

    const handleNewItem = (p: any) => {
      const ticket: Ticket = {
        id: `${p.orderId}-${p.itemId}`,      // để không trùng key
        table: p.tableName,
        items: [{ name: p.name, qty: p.qty }],
        createdAt: p.createdAt,
        priority: p.priority ? "high" : "normal",
      };

      setWaiting((prev) => upsertTicket(prev, ticket));

      toast.success(`Món mới: ${p.name}`, {
        description: `${p.qty} × ${p.name} • ${p.tableName}`,
        style: { background: "#16a34a", color: "white" }, // xanh lá
      });
      new Audio("/sounds/new-order.mp3").play().catch(() => {});
    };

    (async () => {
      await fetch("/api/socket").catch(() => {});
      s = getSocket();
      s.on("kitchen:new_item", handleNewItem);
    })();

    return () => {
      s?.off("kitchen:new_item", handleNewItem);
    };
  }, []);

  // 4) Hoàn tất → chuyển từ waiting → done (không trùng id)
  const markDone = (id: string) => {
    setWaiting((prevW) => {
      const t = prevW.find((x) => x.id === id);
      if (!t) return prevW;
      setDone((prevD) => (prevD.some((x) => x.id === id) ? prevD : [t, ...prevD]));
      return prevW.filter((x) => x.id !== id);
    });
  };

  // 5) Cung ứng → xoá khỏi done
  const serve = (id: string) => {
    setDone((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="flex h-screen flex-col bg-[#0B3C86]">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-2 text-white">
        <div className="text-lg font-semibold">Màn Bếp</div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10"><Volume2 className="h-5 w-5" /></Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10"><Settings className="h-5 w-5" /></Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10"><Bell className="h-5 w-5" /></Button>
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/10"><Menu className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* 2 cột */}
      <div className="grid flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-2">
        {/* Chờ chế biến */}
        <div className="rounded-2xl bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold text-[#0B3C86]">Chờ chế biến</div>
            <Badge variant="secondary">{waiting.length}</Badge>
          </div>

          <div className="h-[calc(100vh-180px)]">
            {waiting.length === 0 ? (
              <EmptyState text="Chưa có đơn hàng cần chế biến" />
            ) : (
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {waiting.map((t) => (
                    <TicketCard key={t.id} t={t} variant="waiting" onDone={markDone} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Đợi cung ứng */}
        <div className="rounded-2xl bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold text-[#0B3C86]">Đợi cung ứng</div>
            <Badge variant="secondary">{done.length}</Badge>
          </div>

          <div className="h-[calc(100vh-180px)]">
            {done.length === 0 ? (
              <EmptyState text="Chưa có đơn hàng cần cung ứng" />
            ) : (
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {done.map((t) => (
                    <TicketCard key={t.id} t={t} variant="done" onServe={serve} />
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
