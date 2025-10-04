"use client";
 import QRCode from "react-qr-code";
import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Catalog, OrderItem, Table as TableType } from "@/types/types";
import { currency } from "@/utils/money";
import { printReceipt } from "@/lib/print";
import QrPanel from "@/components/cashier/modals/QrPanel";
import PaymentSlipPrint from "@/components/cashier/modals/PaymentSlipPrint";
import api from "@/lib/axios"; 
import {
  CircleDollarSign, CreditCard, Wallet, Banknote, Percent, ReceiptText,
} from "lucide-react";
import { useCashierStore } from "@/store/cashier";
import PaymentQrSlip from "@/lib/print/vietqr";
type PayMethod = "cash" | "card" | "vnpay" | "vietqr";

type ReceiptLine = {
  id: string;        // menuItemId
  name: string;
  qty: number;
  price: number;
  total: number;
  rowId?: string;    // <-- optional
};


export type Receipt = {
  id: string; tableId: string; tableName: string; createdAt: string; cashier: string;
  items: ReceiptLine[]; subtotal: number; discount: number; total: number; paid: number; change: number; method: PayMethod;
  customerName?: string;
  guestCount?: number;
};



// === Types ===
type VietQrResp = {
  pngDataUrl?: string; qrBase64?: string; qrDataUrl?: string; image?: string;
  bankName?: string; accountNo?: string; accountNumber?: string;
  accountName?: string; amount?: number; addInfo?: string;
};

type PayOSQrState = {
  kind: "payos";
  invoiceId: string;
  imgUrl?: string;        // ảnh PNG từ PayOS (nếu có)
  qrPayload: string;      // chuỗi EMVCo hoặc fallback là checkoutUrl
  checkoutUrl: string;
  amount: number;
  addInfo: string;
};

type VietQrState = {
  kind: "vietqr";
  invoiceId: string;
  pngDataUrl: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
};

type QRState = PayOSQrState | VietQrState;

const toImgSrc = (s?: string) =>
  s?.startsWith("data:") ? s : `data:image/png;base64,${s ?? ""}`;

const normalizeQr = (raw: VietQrResp) => {
  const src =
    raw.pngDataUrl ??
    raw.qrDataUrl ??
    raw.image ??
    (raw.qrBase64 ? `data:image/png;base64,${raw.qrBase64}` : "");
  return {
    pngDataUrl: src,
    bankName: raw.bankName ?? "",
    accountNo: raw.accountNo ?? raw.accountNumber ?? "",
    accountName: raw.accountName ?? "",
    amount: Number(raw.amount ?? 0),
    addInfo: raw.addInfo ?? "",
  };
};


type Props = {
  open: boolean; onClose: () => void;
  table: TableType; items: OrderItem[]; catalog: Catalog;
  onSuccess: (r: Receipt) => void; orderId: string | null;
  customer?: { id: string; name: string } | null;
onClearCustomer?: () => void; // gọi sau khi thanh toán thành công
};

export default function CheckoutModal({
  open, onClose, table, items, catalog, onSuccess, orderId,
 
}: Props) {

const selectedCus = useCashierStore(s => s.selectedCustomer);
  const clearSelectedCus = useCashierStore(s => s.clearSelectedCustomer);
 const guestCount = useCashierStore((s) => s.guestCount);
  const resetGuest = useCashierStore((s) => s.resetGuestCount);
 const lines: ReceiptLine[] = useMemo(() => {
  const map = new Map<string, ReceiptLine>(); // key = menuItemId
  for (const it of items) {
    const m = catalog.items.find((x) => x.id === it.id);
    if (!m) continue;
    const cur = map.get(it.id) ?? { id: it.id, name: m.name, qty: 0, price: m.price, total: 0 };
    cur.qty += it.qty;
    cur.total = cur.qty * cur.price;
    map.set(it.id, cur);
  }
  return Array.from(map.values());
}, [items, catalog.items]);


const [qr, setQr] = useState<QRState | null>(null);

const toImgSrc = (s?: string) =>
  s?.startsWith("data:") ? s : `data:image/png;base64,${s ?? ""}`;





  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.total, 0), [lines]);

  // ⚠️ BE hiện đang check số thanh toán == totalAmount trên invoice,
  // nên tạm thời KHÔNG áp dụng discount vào số tiền gửi lên BE, tránh Amount mismatch.
  const [discount, setDiscount] = useState(0); // vẫn giữ UI nhưng sẽ không đẩy lên BE
  const totalUI = Math.max(0, subtotal - discount); // để hiển thị/ in bill phía khách
  const [method, setMethod] = useState<PayMethod>("cash");
  const [paid, setPaid] = useState(totalUI);
  useEffect(() => setPaid(totalUI), [totalUI]);

  const change = Math.max(0, paid - totalUI);
  const canConfirm = totalUI > 0 && paid >= totalUI;

const pollPaymentUntilDone = async (txnRef: string, timeoutMs = 5 * 60 * 1000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    // API BE trả {"status":"PENDING"|"PAID"|"FAILED"|"EXPIRED", ...}
    const s = await api.get(`/payments/vnpay/status`, { params: { txnRef } }).then(r => r.data);
    if (['PAID', 'FAILED', 'EXPIRED'].includes(s.status)) return s;
    await new Promise(r => setTimeout(r, 2000)); // 2s/poll
  }
  return { status: 'TIMEOUT' };
};

const handleConfirm = async () => {
  try {
    if (!orderId) {
      toast.error("Chưa có Order cho bàn này. Vui lòng 'Gửi bếp' trước khi thanh toán.");
      return;
    }

    // 1) tạo invoice từ order
     
 const invRes = await api.post(`/invoices/from-order/${orderId}`, {
    customerId: selectedCus?.id ?? null, 
 });
const invoice = invRes.data;


    // 2) số tiền
    const amountToPay = Number(invoice?.totalAmount ?? 0);
    if (!amountToPay) {
      toast.error("Invoice không có tổng tiền hợp lệ.");
      return;
    }

    // === CASH: cộng tiền ngay trên BE như bạn đang làm ===
    if (method === "cash") {
      await api.post(`/invoices/${invoice.id}/payments`, {
        amount: amountToPay,
        method: "CASH",
      });

      const receipt: Receipt = {
        id: invoice.id,
        tableId: table.id,
         customerName: selectedCus?.name ?? invoice?.customer?.name ?? 'Khách lẻ',
        tableName: `${table.name} / ${table.floor}`,
        createdAt: new Date().toLocaleString(),
        cashier: "Thu ngân",
        items: lines,
        subtotal,
        discount,
        total: Math.max(0, subtotal - discount),
        paid: amountToPay,
        change: Math.max(0, paid - Math.max(0, subtotal - discount)),
        method: "cash",
        guestCount
         
      };

      printReceipt(receipt);
      onSuccess(receipt);
     clearSelectedCus();   
       resetGuest();
      onClose();
      toast.success("Thanh toán tiền mặt thành công");
      return;
    }
if (method === "vietqr") {
  // 1) Gọi BE tạo link PayOS (BE đã addPayment PENDING + map orderCode)
// khi chọn "VietQR (PayOS)"
const link = await api.post('/payments/payos/create-link', {
  invoiceId: invoice.id,
  amount: amountToPay,
  buyerName: table.name,
}).then(r => r.data); // { checkoutUrl, qrCode, ... }

const isImg = typeof link.qrCode === "string" && /^(https?:|data:)/i.test(link.qrCode);

setQr({
  kind: "payos",
  invoiceId: invoice.id,
  imgUrl: isImg ? link.qrCode : undefined,
  qrPayload: isImg ? link.checkoutUrl : link.qrCode, // nếu không phải ảnh → dùng chuỗi EMV; nếu là ảnh → dùng checkoutUrl để vẽ fallback
  checkoutUrl: link.checkoutUrl,
  amount: amountToPay,
  addInfo: `INV:${invoice.id.slice(0, 12)}`,
});


await waitUntilPaid(invoice.id);

  // // 3) Chờ kết quả: ưu tiên socket -> fallback polling
  // let resolved = false;
  // let paidAmount = 0;

  // // ===== Socket (nếu bạn đã gắn sẵn socket ở window.posSocket) =====
  // const sock: any = (globalThis as any).posSocket; // socket.io-client | undefined
  // const onPaid = (payload: any) => {
  //   // payload: { invoiceId, amount, method }
  //   if (payload?.invoiceId === invoice.id) {
  //     resolved = true;
  //     paidAmount = Number(payload.amount || amountToPay) || amountToPay;
  //   }
  // };
  // const onPartial = (payload: any) => {
  //   // cần thì hiển thị "đã nhận X, còn Y"
  //   // console.log('partial', payload);
  // };

  // try {
  //   if (sock) {
  //     if (!sock.connected) sock.connect();
  //     sock.emit("join_invoice", { invoiceId: invoice.id });
  //     sock.on("invoice.paid", onPaid);
  //     sock.on("invoice.partial", onPartial);
  //   }

  //   // ===== Polling fallback (10 phút) =====
  //   const timeoutAt = Date.now() + 10 * 60 * 1000;
  //   while (!resolved && Date.now() < timeoutAt) {
  //     const s = await api
  //       .get(`/payments/status`, { params: { invoiceId: invoice.id } })
  //       .then((r) => r.data); // { status, total, paid, remaining }

  //     if (s?.status === "PAID") {
  //       resolved = true;
  //       paidAmount = Number(s?.paid || amountToPay) || amountToPay;
  //       break;
  //     }
  //     await new Promise((r) => setTimeout(r, 2000));
  //   }
  // } finally {
  //   // dọn socket listeners/room
  //   if (sock) {
  //     sock.emit("leave_invoice", { invoiceId: invoice.id });
  //     sock.off("invoice.paid", onPaid);
  //     sock.off("invoice.partial", onPartial);
  //   }
  // }

  // // 4) Xử lý kết quả
  // if (!resolved) {
  //   toast.error("Không nhận được kết quả thanh toán (timeout)");
  //   return;
  // }

  // // 5) In hoá đơn sau khi đã PAID
  // const receipt: Receipt = {
  //   id: invoice.id,
  //   tableId: table.id,
  //   tableName: `${table.name} / ${table.floor}`,
  //   createdAt: new Date().toLocaleString(),
  //   cashier: "Thu ngân",
  //   items: lines,
  //   subtotal,
  //   discount,
  //   total: Math.max(0, subtotal - discount),
  //   paid: paidAmount,
  //   change: 0,
  //   method: "vietqr",
  //   customerName: selectedCus?.name ?? invoice?.customer?.name ?? "Khách lẻ",
  //   guestCount,
  // };

  // printReceipt(receipt);
  // onSuccess(receipt);
  // clearSelectedCus();
  // resetGuest();
  // onClose();
  // toast.success("Đã nhận tiền qua VietQR");
  // return;




  
}


    // === VNPAY: KHÔNG set PAID ở đây; chờ BE xác nhận IPN ===
    if (method === "vnpay") {
      const { data } = await api.post(`/payments/vnpay/create`, {
        invoiceId: invoice.id,
        amount: amountToPay,
        // bankCode: 'VNPAYQR', // bật khi kênh QR đã được VNPay enable
      });

      if (!data?.payUrl || !data?.vnp_TxnRef) {
        toast.error("Không tạo được URL VNPay");
        return;
      }

      // 1) mở popup VNPay
      window.open(data.payUrl, "_blank"); 

      // 2) chờ BE xác nhận qua IPN (polling theo txnRef)
      const result = await pollPaymentUntilDone(data.vnp_TxnRef, 15 * 60 * 1000);

      // try { w?.close(); } catch {}

      if (result.status === "PAID") {
        const receipt: Receipt = {
          id: invoice.id,
          tableId: table.id,
          tableName: `${table.name} / ${table.floor}`,
          createdAt: new Date().toLocaleString(),
          cashier: "Thu ngân",
          items: lines,
          subtotal,
          discount,
          total: Math.max(0, subtotal - discount),
          paid: amountToPay,
          change: 0,
          method: "vnpay",
        };
        printReceipt(receipt);
        onSuccess(receipt);
       clearSelectedCus();   
        resetGuest();
        onClose();
        toast.success("Thanh toán VNPay thành công");
      } else if (result.status === "FAILED") {
        toast.error("Thanh toán VNPay thất bại");
      } else if (result.status === "EXPIRED") {
        toast.error("Mã thanh toán đã hết hạn");
      } else {
        toast.error("Không nhận được kết quả thanh toán (timeout)");
      }

      return;
    }
  } catch (e: any) {
    const msg = e?.response?.data?.message || e.message || "Lỗi thanh toán";
    toast.error("Thanh toán thất bại", { description: msg });
  }
};



  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-[90vw] !max-w-[90vw] !h-[90vh] !max-h-[90vh] p-0 overflow-hidden rounded-2xl">
        <div className="flex h-full flex-col">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-slate-700" />
              Phiếu thanh toán #{receiptShortId()}
              <span className="ml-2 text-sm font-normal text-slate-500">{table.name} / {table.floor}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-4 pb-4">
            <div className="grid h-full gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-xl border flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="font-medium">Khác</div>
             <Badge variant="secondary">
  {lines.length} món
</Badge>


                </div>
                <Separator />
                <div className="flex-1 overflow-auto p-4 space-y-3">
                 {lines.map((l) => (
  <div key={l.id} className="grid grid-cols-12 items-center text-sm">
    <div className="col-span-6 truncate font-medium">{l.name}</div>
    <div className="col-span-2 text-center">x{l.qty}</div>
    <div className="col-span-2 text-right">{currency(l.price)}</div>
    <div className="col-span-2 text-right font-semibold">{currency(l.total)}</div>
  </div>
))}


                </div>
              </div>

              <div className="rounded-xl border p-4 overflow-auto min-h-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tổng tiền hàng</span>
                    <span className="font-semibold">{currency(subtotal)}</span>
                  </div>

                  {/* ⚠️ Discount hiện chỉ hiển thị/in bill, chưa áp dụng BE */}
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-slate-600">
                      <Percent className="h-4 w-4" /> Giảm giá
                    </Label>
                    <Input
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-40 text-right" type="number" min={0} max={subtotal}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Khách cần trả</span>
                    <span className="text-lg font-bold text-[#0B63E5]">{currency(totalUI)}</span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-500">Khách thanh toán</Label>
                   <RadioGroup value={method} onValueChange={(v) => setMethod(v as PayMethod)} className="flex flex-wrap gap-4">
  <div className="flex items-center space-x-2">
    <RadioGroupItem id="m1" value="cash" />
    <Label htmlFor="m1" className="flex items-center gap-1">Tiền mặt</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem id="m4" value="vnpay" />
    <Label htmlFor="m4" className="flex items-center gap-1">VNPay</Label>
  </div>
  <div className="flex items-center space-x-2">
  <RadioGroupItem id="m2" value="vietqr" />
  <Label htmlFor="m2" className="flex items-center gap-1">VietQR</Label>
</div>

</RadioGroup>

                    <div className="flex items-center gap-2">
                      <Input type="number" className="text-right" value={paid} min={0} onChange={(e) => setPaid(Number(e.target.value) || 0)} />
                    </div>

                    <div className="mt-1 flex flex-wrap gap-2">
                      {[90000, 100000, 200000, 500000].map((v) => (
                        <Button key={v} variant="secondary" size="sm" onClick={() => setPaid(v)}>{currency(v)}</Button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tiền thừa trả khách</span>
                      <span className="font-semibold">{currency(Math.max(0, paid - totalUI))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


{qr && qr.kind === "payos" && (
  <>
    {/* Panel QR cho THU NGÂN xem trên màn hình */}
    <div className="screen-only">
      <QrPanel
        provider="payos"
        imgUrl={qr.imgUrl}
        qrPayload={qr.qrPayload}
        checkoutUrl={qr.checkoutUrl}
        amount={qr.amount}
        addInfo={qr.addInfo}
        onToggle={() => setQr(null)}
        onPrint={() => window.print()}
      />
    </div>

    {/* MẪU PHIẾU ẨN – chỉ hiện khi in */}
    <div id="print-slip" className="print-only">
  <PaymentSlipPrint
    shopName="SEAFOOD RESTAURANT"
    shopAddress="123 Lê Lợi, Q.1, TP.HCM"
    invoiceId={qr?.invoiceId ?? ""}
    cashier="Thu ngân"
    tableName={`${table.name} / ${table.floor}`}
    customerName={selectedCus?.name ?? "Khách lẻ"}
    checkInTime={new Date().toLocaleString("vi-VN")}
    checkOutTime={new Date().toLocaleString("vi-VN")}
    items={lines.map(l => ({ name: l.name, qty: l.qty, total: l.total }))}
    subtotal={lines.reduce((s, l) => s + l.total, 0)}
    discount={discount}
    vatRate={10}
    amount={qr?.amount ?? totalUI}
    addInfo={qr?.addInfo ?? `INV:).slice(0,12)}`}
    imgUrl={qr?.imgUrl}
    qrPayload={qr?.qrPayload ?? qr?.checkoutUrl ?? ""}
  />
</div>
  </>
)}





          <DialogFooter className="p-4 border-t bg-background">
            <Button variant="secondary" onClick={onClose}>Đóng</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={!canConfirm} onClick={handleConfirm}>
              <CircleDollarSign className="mr-2 h-5 w-5" /> Thanh toán
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>



  );
}

function receiptShortId() {
  return (Date.now() + "").slice(-4);
}
async function waitUntilPaid(invoiceId: string, timeoutMs = 10 * 60 * 1000) {
  return new Promise<{ paidAmount: number }>(async (resolve, reject) => {
    let resolved = false;
    let paidAmount = 0;

    const sock: any = (globalThis as any).posSocket;
    const onPaid = (p: any) => {
      if (p?.invoiceId === invoiceId) {
        resolved = true;
        paidAmount = Number(p?.amount || 0) || 0;
        cleanup();
        resolve({ paidAmount });
      }
    };
    const onPartial = (_p: any) => {};

    const cleanup = () => {
      if (sock) {
        try {
          sock.emit('leave_invoice', { invoiceId });
          sock.off('invoice.paid', onPaid);
          sock.off('invoice.partial', onPartial);
        } catch {}
      }
    };

    try {
      if (sock) {
        if (!sock.connected) sock.connect();
        sock.emit('join_invoice', { invoiceId });
        sock.on('invoice.paid', onPaid);
        sock.on('invoice.partial', onPartial);
      }

      const endAt = Date.now() + timeoutMs;
      while (!resolved && Date.now() < endAt) {
        const s = await api
          .get('/payments/status', { params: { invoiceId } })
          .then(r => r.data); // { status, paid, ... }
        if (s?.status === 'PAID') {
          resolved = true;
          paidAmount = Number(s?.paid || 0) || 0;
          break;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (e) {
      cleanup();
      return reject(e);
    }

    cleanup();
    if (!resolved) return reject(new Error('TIMEOUT'));
    resolve({ paidAmount });
  });
}
