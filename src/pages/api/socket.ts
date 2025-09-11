import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

type Res = NextApiResponse & {
  socket: NextApiResponse["socket"] & {
    server: HTTPServer & { io?: SocketIOServer };
  };
};

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: Res) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*", methods: ["GET", "POST"] },
    });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("[socket] client connected:", socket.id);

      const forward = (event: string) => (payload: any, cb?: (x: any) => void) => {
        console.log(`[socket] ${event}`, payload);
        // gửi cho client KHÁC (nếu muốn gửi cả chính thu ngân dùng io.emit)
        socket.broadcast.emit(event, payload);
        cb?.("ok");
      };

      // GIỮ NGUYÊN TÊN EVENT
      socket.on("cashier:notify_item", forward("cashier:notify_item"));
      socket.on("cashier:notify_items", forward("cashier:notify_items"));
    });

    console.log("[socket] Socket.IO server started");
  }
  res.end();
}
