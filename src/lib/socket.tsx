// src/lib/socket.ts
import { io, type Socket } from "socket.io-client";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;          // http://localhost:8000
const NS   = process.env.NEXT_PUBLIC_SOCKET_NAMESPACE || "/realtime-pos";
const PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(`${BASE}${NS}`, {
    path: PATH,
    transports: ["websocket"],   // ✅ khớp BE
    withCredentials: false,
    timeout: 15000,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
  });

  socket.on("connect", () => console.log("[socket] ✅ connected:", socket!.id));
  socket.on("connect_error", (e: any) =>
    console.error("[socket] ❌ connect_error:", e?.message || e)
  );

  return socket;
}
