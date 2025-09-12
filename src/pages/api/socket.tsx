import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

type Res = NextApiResponse & {
  socket: NextApiResponse["socket"] & {
    server: HTTPServer & { io?: SocketIOServer };
  };
};

export const config = { api: { bodyParser: false } };

export default function handler(_req: NextApiRequest, res: Res) {
  // ĐỪNG trả 405 – để Socket.IO tự xử lý GET/POST cho polling/handshake
  const srv: any = (res as any)?.socket?.server;
  if (!srv) return res.status(500).end("Socket server not initialized");

  if (!srv.io) {
    const io = new SocketIOServer(srv, {
      path: "/api/socket",
      // giúp path khớp tuyệt đối (tránh /api/socket/)
      addTrailingSlash: false,
      cors: { origin: "*", methods: ["GET", "POST"] },
      transports: ["websocket", "polling"],   // CHO PHÉP polling fallback
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
          console.log(`[socket] ${event}`, payload);
          io.to("kitchen").emit(event, payload);
          cb?.("ok");
        };

      socket.on("cashier:notify_item", toKitchen("cashier:notify_item"));
      socket.on("cashier:notify_items", toKitchen("cashier:notify_items"));

      socket.on("disconnect", (r) => console.log("[socket] disconnect:", r));
    });

    console.log("[socket] Socket.IO server started at /api/socket");
  }

  // luôn 200 để boot, phần WS/polling sẽ do engine.io xử lý riêng
  res.status(200).end("ok");
}
