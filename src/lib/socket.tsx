// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io("", {
    path: "/api/socket",
    transports: ["websocket"],
    withCredentials: false,
    autoConnect: true,
  });
  socket.on("connect", () => console.log("[socket] connect:", socket!.id));
  socket.on("connect_error", (e) => console.error("[socket] connect_error:", e));
  return socket;
}

// Đảm bảo server đã boot và client đã connect trước khi emit/join
export async function ensureSocketReady(): Promise<Socket> {
  await fetch("/api/socket").catch(() => {}); // boot API route server-side
  const s = getSocket();
  if (s.connected) return s;
  return await new Promise<Socket>((resolve, reject) => {
    const to = setTimeout(() => reject(new Error("Socket connect timeout")), 7000);
    s.once("connect", () => {
      clearTimeout(to);
      resolve(s);
    });
    // phòng trường hợp autoConnect:false (ở đây đang true)
    s.connect();
  });
}
