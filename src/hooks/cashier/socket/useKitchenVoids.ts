"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

export type KitchenVoidLast = {
  menuItemId: string;
  orderItemId: string | null;
  ticketId?: string;
  qty: number;
  reason?: string;
  by?: string;
  at: string; // ISO
};

export type KitchenVoidInfo = {
  qty: number;
  last?: KitchenVoidLast;
};

export type KitchenVoidsMap = Record<string, KitchenVoidInfo>;

type VoidSyncedPayload = {
  orderId: string;
  menuItemId: string;
  orderItemId: string | null;
  qty: number;
  reason?: string;
  by?: string;
  ticketId: string;
};

type TicketsVoidedPayload = {
  orderId: string;
  items?: Array<{
    menuItemId: string;
    qty: number;
    reason?: string | null;
    by?: string | null;
  }>;
};

export function useKitchenVoids(orderId?: string) {
  const [voids, setVoids] = useState<KitchenVoidsMap>({});

  // đổi order thì clear
  useEffect(() => {
    setVoids({});
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    if (!socket) return;

    // useKitchenVoids.ts
const handleVoidSynced = (payload: VoidSyncedPayload) => {
  if (payload.orderId !== orderId) return;

  // Nếu chính thu ngân hủy → không cần show banner trên hóa đơn
  if (payload.by === "cashier") return;

  const key = payload.menuItemId;
  if (!key) return;

  setVoids((prev) => {
    const cur = prev[key] ?? { qty: 0 };
    return {
      ...prev,
      [key]: {
        qty: cur.qty + (payload.qty ?? 0),
        last: {
          menuItemId: payload.menuItemId,
          orderItemId: payload.orderItemId,
          ticketId: payload.ticketId,
          qty: payload.qty ?? 0,
          reason: payload.reason,
          by: payload.by,
          at: new Date().toISOString(),
        },
      },
    };
  });
};

const handleTicketsVoided = (payload: TicketsVoidedPayload) => {
  if (payload.orderId !== orderId) return;
  if (!payload.items?.length) return;

  // Lọc bỏ những lần hủy do thu ngân
  const items = payload.items.filter((it) => it.by !== "cashier");
  if (!items.length) return;

  setVoids((prev) => {
    const next = { ...prev };
    for (const item of items) {
      const key = item.menuItemId;
      const cur = next[key] ?? { qty: 0 };
      next[key] = {
        qty: cur.qty + (item.qty ?? 0),
        last: {
          menuItemId: item.menuItemId,
          orderItemId: null,
          ticketId: undefined,
          qty: item.qty ?? 0,
          reason: item.reason ?? undefined,
          by: item.by ?? undefined,
          at: new Date().toISOString(),
        },
      };
    }
    return next;
  });
};


    socket.on("kitchen:void_synced", handleVoidSynced);
    socket.on("kitchen:tickets_voided", handleTicketsVoided);

    return () => {
      socket.off("kitchen:void_synced", handleVoidSynced);
      socket.off("kitchen:tickets_voided", handleTicketsVoided);
    };
  }, [orderId]);

  // key bây giờ là menuItemId
  const clearKitchenVoid = (menuItemId: string) => {
    setVoids((prev) => {
      const next = { ...prev };
      delete next[menuItemId];
      return next;
    });
  };

  const clearAllKitchenVoids = () => setVoids({});

  return { kitchenVoids: voids, clearKitchenVoid, clearAllKitchenVoids };
}
