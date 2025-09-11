import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io("", { path: "/api/socket", transports: ["websocket"] });
  socket.on("connect", () => console.log("[socket] connect:", socket!.id));
  socket.on("connect_error", (e) => console.error("[socket] connect_error:", e));
  socket.onAny((ev, ...args) => console.log("[socket] <-", ev, args));
  return socket;
}
