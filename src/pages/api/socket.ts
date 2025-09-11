// /pages/api/socket.ts (Next API route)
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
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*", methods: ["GET", "POST"] },
    });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("[socket] connected:", socket.id);

      // cho Kitchen tham gia room
      socket.on("room:join", (room: string) => {
        socket.join(room);
        console.log(`[socket] ${socket.id} joined ${room}`);
      });

      // forward sự kiện từ thu ngân -> room 'kitchen'
      const toKitchen = (event: string) => (payload: any, cb?: (x: any) => void) => {
        console.log(`[socket] ${event}`, payload);
        io.to("kitchen").emit(event, payload); // <-- quan trọng
        cb?.("ok");
      };

      socket.on("cashier:notify_item", toKitchen("cashier:notify_item"));
      socket.on("cashier:notify_items", toKitchen("cashier:notify_items"));
    });

    console.log("[socket] Socket.IO server started");
  }
  res.end();
}
