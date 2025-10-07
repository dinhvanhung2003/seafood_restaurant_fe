import { io, Socket } from "socket.io-client";
let _socket: Socket | null = null;

export function getSocket() {
  if (_socket) return _socket;
  const BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/,'');
  _socket = io(`${BASE}/realtime`, {
    path: "/socket.io",
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
  });
  return _socket;
}