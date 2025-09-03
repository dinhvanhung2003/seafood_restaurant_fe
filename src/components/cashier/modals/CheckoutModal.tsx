"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  CircleDollarSign,
  CreditCard,
  Wallet,
  Banknote,
  Percent,
  ReceiptText,
} from "lucide-react";

type PayMethod = "cash" | "card" | "transfer";

type ReceiptLine = {
  id: string;
  name: string;
  qty: number;
  price: number;
  total: number;
};

export type Receipt = {
  id: string;
  tableId: string;
  tableName: string;
  createdAt: string;
  cashier: string;
  items: ReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  method: PayMethod;
};

type Props = {
  open: boolean;
  onClose: () => void;
  table: TableType;
  items: OrderItem[];
  catalog: Catalog;
  onSuccess: (r: Receipt) => void;
};

export default function CheckoutModal({
  open,
  onClose,
  table,
  items,
  catalog,
  onSuccess,
}: Props) {
  const lines: ReceiptLine[] = useMemo(() => {
    return items
      .map((it) => {
        const m = catalog.items.find((x) => x.id === it.id);
        if (!m) return null;
        return {
          id: it.id,
          name: m.name,
          qty: it.qty,
          price: m.price,
          total: m.price * it.qty,
        };
      })
      .filter(Boolean) as ReceiptLine[];
  }, [items, catalog.items]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.total, 0), [lines]);
  const [discount, setDiscount] = useState(0);
  const total = Math.max(0, subtotal - discount);

  const [method, setMethod] = useState<PayMethod>("cash");
  const [paid, setPaid] = useState(total);
  useEffect(() => setPaid(total), [total]);

  const change = Math.max(0, paid - total);
  const quicks = [90000, 100000, 200000, 500000];
  const canConfirm = total > 0 && paid >= total;

  const handleConfirm = () => {
    const receipt: Receipt = {
      id: `HD${Date.now()}`,
      tableId: table.id,
      tableName: `${table.name} / ${table.floor}`,
      createdAt: new Date().toLocaleString(),
      cashier: "Nguyễn Văn Hưng",
      items: lines,
      subtotal,
      discount,
      total,
      paid,
      change,
      method,
    };
    printReceipt(receipt);
    onSuccess(receipt);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          !w-[90vw] !max-w-[90vw]
          !h-[90vh] !max-h-[90vh]
          p-0 overflow-hidden rounded-2xl
        "
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-slate-700" />
              Phiếu thanh toán #{receiptShortId()}
              <span className="ml-2 text-sm font-normal text-slate-500">
                {table.name} / {table.floor}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-hidden px-4 pb-4">
            {/* grid full height so inner columns can scroll */}
            <div className="grid h-full gap-6 lg:grid-cols-[2fr_1fr]">
              {/* LEFT: danh sách món */}
              <div className="rounded-xl border flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="font-medium">Khác</div>
                  <Badge variant="secondary">
                    {items.reduce((s, i) => s + i.qty, 0)} món
                  </Badge>
                </div>
                <Separator />
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {lines.map((l) => (
                    <div key={l.id} className="grid grid-cols-12 items-center text-sm">
                      <div className="col-span-6 truncate font-medium">{l.name}</div>
                      <div className="col-span-2 text-center">x{l.qty}</div>
                      <div className="col-span-2 text-right">{currency(l.price)}</div>
                      <div className="col-span-2 text-right font-semibold">
                        {currency(l.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: panel tính tiền */}
              <div className="rounded-xl border p-4 overflow-auto min-h-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tổng tiền hàng</span>
                    <span className="font-semibold">{currency(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-slate-600">
                      <Percent className="h-4 w-4" />
                      Giảm giá
                    </Label>
                    <Input
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-40 text-right"
                      type="number"
                      min={0}
                      max={subtotal}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Khách cần trả</span>
                    <span className="text-lg font-bold text-[#0B63E5]">
                      {currency(total)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-500">Khách thanh toán</Label>
                    <RadioGroup
                      value={method}
                      onValueChange={(v) => setMethod(v as PayMethod)}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="m1" value="cash" />
                        <Label htmlFor="m1" className="flex items-center gap-1">
                          <Wallet className="h-4 w-4" />
                          Tiền mặt
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="m2" value="card" />
                        <Label htmlFor="m2" className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          Thẻ
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem id="m3" value="transfer" />
                        <Label htmlFor="m3" className="flex items-center gap-1">
                          <Banknote className="h-4 w-4" />
                          Chuyển khoản
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="text-right"
                        value={paid}
                        min={0}
                        onChange={(e) => setPaid(Number(e.target.value) || 0)}
                      />
                    </div>

                    <div className="mt-1 flex flex-wrap gap-2">
                      {quicks.map((v) => (
                        <Button
                          key={v}
                          variant="secondary"
                          size="sm"
                          onClick={() => setPaid(v)}
                        >
                          {currency(v)}
                        </Button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tiền thừa trả khách</span>
                      <span className="font-semibold">{currency(change)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t bg-background">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              <CircleDollarSign className="mr-2 h-5 w-5" />
              Thanh toán
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
