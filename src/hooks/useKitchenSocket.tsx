"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export type KitchenEvent =
  | { type: "notify_kitchen"; payload: any }
  | { type: "ping" };

type Options = {
  url: string;                     
  onNotify: (payload: any) => void; // gọi khi có đơn mới
};

export function useKitchenSocket({ url, onNotify }: Options) {
  const sockRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    sockRef.current = socket;

    socket.on("connect", () => {
      // có thể join phòng bếp tùy theo chi nhánh
      // socket.emit("kitchen:join", { branchId: "center" });
    });

    // Thu ngân bấm Thông báo => server emit
    socket.on("notify_kitchen", (payload: any) => {
      onNotify?.(payload);
    });

    // clean up
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      sockRef.current = null;
    };
  }, [url, onNotify]);

  return sockRef.current;
}
