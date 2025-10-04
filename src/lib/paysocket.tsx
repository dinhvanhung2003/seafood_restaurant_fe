// src/lib/socket.ts: giữ nguyên getSocket()

import api from "@/lib/axios";
import { getSocket } from "@/lib/mainsocket";

export async function waitUntilPaid(invoiceId: string, timeoutMs = 10 * 60 * 1000) {
  return new Promise<{ paidAmount: number }>(async (resolve, reject) => {
    const sock = getSocket();
    let finished = false;
    let paidAmount = 0;

    const clear = () => {
      try {
        sock.emit("leave_invoice", { invoiceId });
        sock.off("connect", onConnect);
        sock.off("invoice.paid", onPaid);
        sock.off("invoice.partial", onPartial);
      } catch {}
    };

    const onPaid = (p: any) => {
      if (p?.invoiceId !== invoiceId) return;
      finished = true;
      paidAmount = Number(p?.amount || 0) || 0;
      clear();
      resolve({ paidAmount });
    };
    const onPartial = (_p: any) => { /* tùy bạn: cập nhật UI còn thiếu bao nhiêu */ };

    const onConnect = async () => {
      // Sau khi thật sự connected mới join để chắc chắn
      sock.emit("join_invoice", { invoiceId });

      // ⚡ BẮT KỊP SỰ KIỆN ĐÃ PHÁT TRƯỚC ĐÓ:
      try {
        const s = await api.get("/payments/status", { params: { invoiceId } }).then(r => r.data);
        if (s?.status === "PAID") {
          finished = true;
          paidAmount = Number(s?.paid || 0) || 0;
          clear();
          return resolve({ paidAmount });
        }
      } catch {}
    };

    try {
      // Lắng nghe trước rồi mới connect
      sock.on("connect", onConnect);
      sock.on("invoice.paid", onPaid);
      sock.on("invoice.partial", onPartial);
      if (!sock.connected) sock.connect();
      else onConnect(); // đã connected thì xử lý ngay

      // Fallback polling 2s/lần
      const endAt = Date.now() + timeoutMs;
      while (!finished && Date.now() < endAt) {
        const s = await api.get("/payments/status", { params: { invoiceId } }).then(r => r.data);
        if (s?.status === "PAID") {
          finished = true;
          paidAmount = Number(s?.paid || 0) || 0;
          break;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (e) {
      clear();
      return reject(e);
    }

    clear();
    if (!finished) return reject(new Error("TIMEOUT"));
    resolve({ paidAmount });
  });
}
