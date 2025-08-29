// pages/api/socket.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";

type Res = NextApiResponse & {
  socket: NextApiResponse["socket"] & {
    server: NetServer & { io?: SocketIOServer };
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

      socket.on("cashier:notify_item", (payload, cb) => {
        console.log("[socket] cashier:notify_item", payload);
        io.emit("kitchen:new_item", payload);
        cb?.("ok");
      });
    });

    console.log("[socket] Socket.IO server started");
  }
  res.end();
}
