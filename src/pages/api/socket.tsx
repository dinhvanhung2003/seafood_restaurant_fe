// src/pages/api/socket.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export const config = { api: { bodyParser: false } };

// ✅ khai báo kiểu trả về rõ ràng: void
export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  // Lấy server từ socket, cast any để khỏi lệch kiểu
  const srv = (res.socket as any)?.server as (HTTPServer & { io?: SocketIOServer });

  if (!srv) {
    res.status(500).end("Socket server not initialized");
    return; // ✅ kết thúc hàm, KHÔNG return response
  }

  if (!srv.io) {
    const io = new SocketIOServer(srv, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: { origin: "*", methods: ["GET", "POST"] },
      transports: ["websocket", "polling"],
    });
    srv.io = io;

    io.on("connection", (socket) => {
      console.log("[socket] connected:", socket.id);

      socket.on("room:join", (room: string) => {
        socket.join(room);
        console.log(`[socket] ${socket.id} joined ${room}`);
      });

      const toKitchen =
        (event: string) => (payload: any, cb?: (x: any) => void) => {
          io.to("kitchen").emit(event, payload);
          cb?.("ok");
        };

      socket.on("cashier:notify_item", toKitchen("cashier:notify_item"));
      socket.on("cashier:notify_items", toKitchen("cashier:notify_items"));

      socket.on("disconnect", (r) => console.log("[socket] disconnect:", r));
    });

    console.log("[socket] Socket.IO server started at /api/socket");
  }

  // ✅ chỉ end response, không return response
  res.status(200).end("ok");
}
