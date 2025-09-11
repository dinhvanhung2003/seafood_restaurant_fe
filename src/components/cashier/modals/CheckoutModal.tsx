"use client";

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
import api from "@/lib/axios"; // ✅ default import (QUAN TRỌNG)
import {
  CircleDollarSign, CreditCard, Wallet, Banknote, Percent, ReceiptText,
} from "lucide-react";

type PayMethod = "cash" | "card" | "vnpay";

type ReceiptLine = { id: string; name: string; qty: number; price: number; total: number; };
export type Receipt = {
  id: string; tableId: string; tableName: string; createdAt: string; cashier: string;
  items: ReceiptLine[]; subtotal: number; discount: number; total: number; paid: number; change: number; method: PayMethod;
};

type Props = {
  open: boolean; onClose: () => void;
  table: TableType; items: OrderItem[]; catalog: Catalog;
  onSuccess: (r: Receipt) => void; orderId: string | null;
};

export default function CheckoutModal({
  open, onClose, table, items, catalog, onSuccess, orderId,
}: Props) {
  const lines: ReceiptLine[] = useMemo(() => {
    return items.map((it) => {
      const m = catalog.items.find((x) => x.id === it.id);
      if (!m) return null as any;
      return { id: it.id, name: m.name, qty: it.qty, price: m.price, total: m.price * it.qty };
    }).filter(Boolean) as ReceiptLine[];
  }, [items, catalog.items]);

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
    const invRes = await api.post(`/invoices/from-order/${orderId}`, {});
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
      };

      printReceipt(receipt);
      onSuccess(receipt);
      onClose();
      toast.success("Thanh toán tiền mặt thành công");
      return;
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
      const w = window.open(
        data.payUrl,
        "vnpay",
        "width=520,height=720,noopener,noreferrer"
      );

      // 2) chờ BE xác nhận qua IPN (polling theo txnRef)
      const result = await pollPaymentUntilDone(data.vnp_TxnRef, 15 * 60 * 1000);

      try { w?.close(); } catch {}

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
                  <Badge variant="secondary">{items.reduce((s, i) => s + i.qty, 0)} món</Badge>
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
