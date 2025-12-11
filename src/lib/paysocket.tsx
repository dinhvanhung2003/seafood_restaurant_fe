import api from "@/lib/axios";
import { getPaymentSocket } from "@/lib/paymentSocket";

export async function waitUntilPaid(invoiceId: string, timeoutMs = 10*60*1000) {
  return new Promise<{ paidAmount:number }>(async (resolve, reject) => {
    const sock =  getPaymentSocket(); 
    let done = false;
    let paidAmount = 0;

    const cleanup = () => {
      try {
        sock.emit("leave_invoice", { invoiceId });
        sock.off("connect", onConnect);
        sock.off("invoice.paid", onPaid);
        sock.off("invoice.partial", onPartial);
      } catch {}
    };

    const onPaid = (p:any) => {
      if (p?.invoiceId !== invoiceId) return;
      done = true; paidAmount = Number(p?.amount||0)||0;
      cleanup(); resolve({ paidAmount });
    };
    const onPartial = (_p:any) => {};

    const onConnect = async () => {
      sock.emit("join_invoice", { invoiceId });
      try {
        const s = await api.get("/payments/status", { params: { invoiceId } }).then(r=>r.data);
        if (s?.status === "PAID") {
          done = true; paidAmount = Number(s?.paid||0)||0;
          cleanup(); resolve({ paidAmount });
        }
      } catch {}
    };

    try {
      sock.on("connect", onConnect);
      sock.on("invoice.paid", onPaid);
      sock.on("invoice.partial", onPartial);
      if (!sock.connected) sock.connect(); else onConnect();

      // fallback polling
      const end = Date.now()+timeoutMs;
      while(!done && Date.now()<end){
        const s = await api.get("/payments/status", { params: { invoiceId } }).then(r=>r.data);
        if (s?.status === "PAID") { done = true; paidAmount = Number(s?.paid||0)||0; break; }
        await new Promise(r=>setTimeout(r,2000));
      }
    } catch(e){
      cleanup(); return reject(e);
    }

    cleanup();
    if (!done) return reject(new Error("TIMEOUT"));
    resolve({ paidAmount });
  });
}