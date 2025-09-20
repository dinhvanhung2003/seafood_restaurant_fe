"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // nếu có, không thì bỏ
import { useEffect, useState } from "react";
import api from "@/lib/axios";

type ReceiptItem = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discountType: "AMOUNT" | "PERCENT";
  discountValue: number;
  receivedUnit?: string;
  conversionToBase?: number;
  lotNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  lineTotal: number;
};

type ReceiptDetail = {
  id: string;
  code: string;
  status: string;
  supplier?: { id: string; name: string };
  receiptDate: string; // YYYY-MM-DD
  shippingFee: number;
  amountPaid: number;
  globalDiscountType: "AMOUNT" | "PERCENT";
  globalDiscountValue: number;
  note?: string;
  subTotal: number;
  grandTotal: number;
  items: ReceiptItem[];
};

function money(n?: number) {
  return Number(n || 0).toLocaleString();
}
function fmtDiscount(type: "AMOUNT" | "PERCENT", val: number) {
  return type === "PERCENT" ? `${val}%` : money(val);
}

export default function PurchaseReceiptDetailModal({
  open,
  onOpenChange,
  id,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  id?: string | null;
}) {
  const [data, setData] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !id) return;
    setLoading(true);
    api
      .get<ReceiptDetail>(`/purchasereceipt/getId/${id}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [open, id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* rộng theo viewport, không tràn */}
      <DialogContent className="w-[94vw] sm:max-w-5xl">
        <div className="p-4 space-y-4">
          <DialogHeader className="p-0">
            <DialogTitle>
              Chi tiết phiếu nhập {data?.code ? `— ${data.code}` : ""}
            </DialogTitle>
          </DialogHeader>

          {loading && <div className="text-sm text-slate-500">Đang tải…</div>}
          {!loading && !data && (
            <div className="text-sm text-slate-500">Không tìm thấy phiếu.</div>
          )}

          {!!data && (
            <>
              {/* Header info */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-slate-500 text-sm">Ngày</div>
                  <div className="font-medium">{data.receiptDate}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm">Nhà cung cấp</div>
                  <div className="font-medium">{data.supplier?.name || "—"}</div>
                </div>
                <div>
                  {/* <div className="text-slate-500 text-sm">Trạng thái</div>
                  <div className="font-medium">{data.status}</div> */}
                </div>
                <div className="sm:col-span-3">
                  <div className="text-slate-500 text-sm">Ghi chú</div>
                  <div className="font-medium">{data.note || "—"}</div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded border bg-white">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[10%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Tên hàng</th>
                      <th className="px-3 py-2 text-right">SL</th>
                      <th className="px-3 py-2 text-right">Đơn giá</th>
                      <th className="px-3 py-2 text-right">CK</th>
                      <th className="px-3 py-2 text-right">ĐVT</th>
                      <th className="px-3 py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((it) => (
                      <tr key={it.id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{it.itemName}</div>
                          <div className="text-xs text-slate-500">
                            {it.lotNumber ? `Lô: ${it.lotNumber}` : ""}
                            {it.expiryDate ? ` • HSD: ${it.expiryDate}` : ""}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {money(it.quantity)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {money(it.unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {fmtDiscount(it.discountType, it.discountValue)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {it.receivedUnit || "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {money(it.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t">
                      <td colSpan={5} className="px-3 py-2 text-right">
                        Tạm tính
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {money(data.subTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right">
                        Chiết khấu chung
                        {` (${fmtDiscount(
                          data.globalDiscountType,
                          data.globalDiscountValue
                        )})`}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        -{money(
                          data.globalDiscountType === "PERCENT"
                            ? Math.round((data.subTotal * data.globalDiscountValue) / 100)
                            : data.globalDiscountValue
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right">
                        Phí vận chuyển
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {money(data.shippingFee)}
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td colSpan={5} className="px-3 py-2 text-right font-semibold">
                        Tổng thanh toán
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {money(data.grandTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right">
                        Đã thanh toán
                      </td>
                      <td className="px-3 py-2 text-right">{money(data.amountPaid)}</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right">
                        Còn phải trả
                      </td>
                      <td className="px-3 py-2 text-right">
                        {money(data.grandTotal - data.amountPaid)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  In/PDF
                </Button>
                <Button onClick={() => onOpenChange(false)}>Đóng</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
