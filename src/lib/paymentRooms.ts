import { getPaymentSocket } from "@/lib/paymentSocket";

const refCount = new Map<string, number>();

export function retainInvoiceRoom(invoiceId: string) {
  const s = getPaymentSocket();
  if (!s) return () => {};

  const key = `invoice:${invoiceId}`;
  const n = (refCount.get(key) ?? 0) + 1;
  refCount.set(key, n);

  // chỉ emit join ở lần đầu
  if (n === 1) {
    const join = () => s.emit("join_invoice", { invoiceId });
    if (s.connected) join();
    else s.once("connect", join);
  }

  // release
  return () => {
    const cur = (refCount.get(key) ?? 0) - 1;
    if (cur <= 0) {
      refCount.delete(key);
      try {
        s.emit("leave_invoice", { invoiceId });
      } catch {}
    } else {
      refCount.set(key, cur);
    }
  };
}
