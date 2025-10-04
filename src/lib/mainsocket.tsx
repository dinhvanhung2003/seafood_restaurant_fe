// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function getSocket() {
  if (_socket) return _socket;

  const BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "";
  _socket = io(`${BASE}/realtime`, {
    path: "/socket.io",           // mặc định, đổi nếu BE đổi
    transports: ["websocket"],    // ưu tiên ws
    autoConnect: false,
    reconnection: true,
    withCredentials: false,
  });

  return _socket;
}
