"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useInvoiceReturnSummary } from "@/hooks/admin/useInvoiceReturnSummary";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

type Props = {
  invoiceId?: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type ReturnRow = {
  orderItemId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  soldQty: number;
  returnedQty: number;
  remainQty: number; // từ BE: remainQty
  qty: number; // SL trả
  reason: string;
};

type RefundMethod = "CASH" | "BANK_TRANSFER" | "CARD";

const formatCurrency = (v: number | null | undefined) =>
  (Number(v || 0)).toLocaleString("vi-VN");

export function ReturnDetailModal({
  invoiceId,
  open,
  onClose,
  onSuccess,
}: Props) {
  const { data, isLoading } = useInvoiceReturnSummary(invoiceId, open);

  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("CASH");
  const [note, setNote] = useState("");

  // Khi mở modal + có data mới thì set lại state hàng
  useEffect(() => {
    if (!open || !data) return;

    setRows(
      data.items.map((it) => ({
        orderItemId: it.orderItemId,
        menuItemId: it.menuItemId,
        name: it.name,
        unitPrice: it.unitPrice,
        soldQty: it.soldQty,
        returnedQty: it.returnedQty,
        remainQty: it.remainQty,
        qty: 0, // luôn khởi tạo = 0 (number hợp lệ)
        reason: "",
      })),
    );

    setRefundMethod("CASH");
    setNote("");
  }, [open, data]);

  const totalGoodsAmount = useMemo(
    () =>
      rows.reduce((sum, r) => {
        const line = (r.qty || 0) * (r.unitPrice || 0);
        return sum + line;
      }, 0),
    [rows],
  );

  const handleQtyChange = (orderItemId: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.orderItemId !== orderItemId) return r;

        // Cho phép xóa hết -> xem như 0
        if (value === "") {
          return { ...r, qty: 0 };
        }

        const n = Number(value);
        if (Number.isNaN(n)) {
          // không set NaN vào state
          return r;
        }

        const clamped = Math.max(0, Math.min(n, r.remainQty));
        return { ...r, qty: clamped };
      }),
    );
  };

  const handleReasonChange = (orderItemId: string, value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.orderItemId === orderItemId ? { ...r, reason: value } : r,
      ),
    );
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!invoiceId) return;
    const items = rows
      .filter((r) => r.qty > 0)
      .map((r) => ({
        orderItemId: r.orderItemId,
        qty: r.qty,
        reason: r.reason.trim() || undefined,
      }));

    if (!items.length) {
      alert("Vui lòng nhập số lượng trả cho ít nhất 1 món.");
      return;
    }

    await api.post("/returns", {
      invoiceId,
      refundMethod,
      note: note.trim() || null,
      items,
    });

    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="w-[min(98vw,1100px)] max-h-[90vh] p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-lg font-semibold">
            Trả hàng – {data?.invoice?.invoiceNumber ?? "—"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-6 text-sm overflow-auto max-h-[calc(90vh-64px)]">
          {/* Thông tin hóa đơn */}
          {data && (
            <div className="flex flex-wrap justify-between text-xs text-slate-600 mb-2">
              <div className="space-y-1">
                <div>
                  <span className="font-medium text-slate-700">Bàn:&nbsp;</span>
                  <span>{data.invoice?.tableName ?? "—"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">
                    Khách hàng:&nbsp;
                  </span>
                  <span>{data.invoice?.customerName ?? "Khách lẻ"}</span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div>
                  Tổng hóa đơn:&nbsp;
                  <span className="font-semibold">
                    {formatCurrency(data.invoice?.finalAmount ?? 0)}
                  </span>
                </div>
                <div>
                  Đã giảm:&nbsp;
                  <span>{formatCurrency(data.invoice?.discountTotal ?? 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bảng chọn món trả */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Món</th>
                  <th className="px-3 py-2 text-right w-[70px]">SL bán</th>
                  <th className="px-3 py-2 text-right w-[70px]">Đã trả</th>
                  <th className="px-3 py-2 text-right w-[70px]">Còn lại</th>
                  <th className="px-3 py-2 text-right w-[80px]">SL trả</th>
                  <th className="px-3 py-2 text-left w-[220px]">Lý do</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-slate-500"
                    >
                      Đang tải dữ liệu hóa đơn…
                    </td>
                  </tr>
                ) : !data || !data.items.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-slate-500"
                    >
                      Hóa đơn này không có món nào.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.orderItemId} className="border-t align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium text-[13px]">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Đơn giá: {formatCurrency(r.unitPrice)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {r.soldQty}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {r.returnedQty}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {r.remainQty}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        <input
                          type="number"
                          min={0}
                          max={r.remainQty}
                          value={r.qty ?? 0} // ✅ luôn là number, không NaN
                          onChange={(e) =>
                            handleQtyChange(r.orderItemId, e.target.value)
                          }
                          className="w-16 rounded border px-2 py-1 text-right text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Textarea
                          rows={1}
                          value={r.reason}
                          onChange={(e) =>
                            handleReasonChange(r.orderItemId, e.target.value)
                          }
                          className="min-h-[32px] text-xs"
                          placeholder="Lý do khách trả (tuỳ chọn)"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Tổng tiền + phương thức hoàn tiền + ghi chú */}
          <div className="mt-3 space-y-3 text-xs">
            <div className="flex items-baseline gap-2">
              <span>Tổng tiền hàng trả:</span>
              <span className="text-lg font-semibold text-emerald-600">
                {formatCurrency(totalGoodsAmount)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Hệ thống sẽ kiểm tra lại số lượng đã trả trước đó, nếu vượt quá sẽ
              bị chặn (NO_ITEMS_TO_RETURN).
            </p>

            <div className="space-y-2">
              <div className="font-medium text-slate-700">
                Phương thức hoàn tiền
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={refundMethod === "CASH" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRefundMethod("CASH")}
                >
                  Tiền mặt
                </Button>
                <Button
                  type="button"
                  variant={
                    refundMethod === "BANK_TRANSFER" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setRefundMethod("BANK_TRANSFER")}
                >
                  Chuyển khoản
                </Button>
                <Button
                  type="button"
                  variant={refundMethod === "CARD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRefundMethod("CARD")}
                >
                  Thẻ
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-medium text-slate-700">
                Ghi chú thêm cho phiếu trả (tuỳ chọn)
              </div>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="VD: Khách trả vì đồ uống bị nhầm, hoàn tiền lại bằng tiền mặt…"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={totalGoodsAmount <= 0 || isLoading}
              className={cn(
                "min-w-[170px]",
                totalGoodsAmount <= 0 && "cursor-not-allowed opacity-70",
              )}
            >
              Tạo phiếu trả hàng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
