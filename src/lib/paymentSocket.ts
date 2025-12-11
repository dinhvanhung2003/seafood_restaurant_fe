// src/lib/paymentSocket.ts
import { io, type Socket } from "socket.io-client";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!; // ví dụ: https://....trycloudflare.com
const PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io";

// ⚠️ Phải KHỚP với PaymentsGateway: namespace: '/realtime'
const NS = "/realtime";

let paySocket: Socket | null = null;

export function getPaymentSocket(): Socket {
  if (paySocket) return paySocket;

  paySocket = io(`${BASE}${NS}`, {
    path: PATH,
    transports: ["websocket"],
    withCredentials: false,
    timeout: 15000,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
  });

  paySocket.on("connect", () => {
    console.log("[PAY socket] ✅ connected:", paySocket!.id, "ns=", NS);
  });

  paySocket.on("connect_error", (e: any) => {
    console.error("[PAY socket] ❌ connect_error:", e?.message || e);
  });

  return paySocket;
}
