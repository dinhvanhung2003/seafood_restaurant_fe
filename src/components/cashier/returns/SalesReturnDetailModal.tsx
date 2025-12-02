"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSalesReturnDetail } from "@/hooks/admin/useSalesReturnDetail";

type Props = {
  id?: string;
  open: boolean;
  onClose: () => void;
};

const formatCurrency = (v: number | null | undefined) =>
  (Number(v || 0)).toLocaleString("vi-VN");

const formatDateTime = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function SalesReturnDetailModal({ id, open, onClose }: Props) {

  const { data, isLoading } = useSalesReturnDetail(id, open);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="w-[min(98vw,1200px)] max-h-[90vh] p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-lg font-semibold">
            Chi tiết phiếu trả hàng{" "}
            {data?.returnNumber ? `– ${data.returnNumber}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-6 text-sm overflow-auto max-h-[calc(90vh-64px)]">
          {/* Thông tin chung */}
          {data && (
            <div className="grid gap-4 md:grid-cols-3 text-xs text-slate-600">
              <div className="space-y-1">
                <div>
                  <span className="font-medium text-slate-700">
                    Hóa đơn:&nbsp;
                  </span>
                  <span>{data.invoiceNumber ?? "—"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">
                    Bàn:&nbsp;
                  </span>
                  <span>{data.tableName ?? "—"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">
                    Khách hàng:&nbsp;
                  </span>
                  <span>{data.customerName ?? "Khách lẻ"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div>
                  <span className="font-medium text-slate-700">
                    Thu ngân:&nbsp;
                  </span>
                  <span>{data.cashierName ?? "—"}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">
                    Ngày tạo:&nbsp;
                  </span>
                  <span>{formatDateTime(data.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">
                    Phương thức hoàn tiền:&nbsp;
                  </span>
                  <span>
                    {data.refundMethod === "CASH"
                      ? "Tiền mặt"
                      : data.refundMethod === "BANK_TRANSFER"
                      ? "Chuyển khoản"
                      : data.refundMethod === "CARD"
                      ? "Thẻ"
                      : data.refundMethod}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div>
                  <span className="font-medium text-slate-700">
                    Tiền hàng:&nbsp;
                  </span>
                  <span>{formatCurrency(data.goodsAmount)}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">
                    Giảm:&nbsp;
                  </span>
                  <span>{formatCurrency(data.discountAmount)}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">
                    Hoàn lại:&nbsp;
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(data.refundAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bảng món trả */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Món</th>
                  <th className="px-3 py-2 text-right w-[70px]">SL trả</th>
                  <th className="px-3 py-2 text-right w-[100px]">Đơn giá</th>
                  <th className="px-3 py-2 text-right w-[110px]">
                    Thành tiền
                  </th>
                  <th className="px-3 py-2 text-left w-[220px]">Lý do</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Đang tải chi tiết phiếu trả hàng…
                    </td>
                  </tr>
                ) : !data || (data.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Phiếu này không có dòng món nào.
                    </td>
                  </tr>
                ) : (
                  data.items.map((it) => (
                    <tr key={it.id} className="border-t align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium text-[13px]">
                          {it.menuItemName}
                          {/* nếu BE trả field 'name' thì đổi thành it.name */}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {it.qty}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {formatCurrency(it.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {formatCurrency(it.lineAmount)}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        {it.reason || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Ghi chú */}
          {data?.note && (
            <div className="mt-1 text-xs">
              <div className="mb-1 font-medium text-slate-700">
                Ghi chú phiếu:
              </div>
              <div className="rounded-md border bg-slate-50 px-3 py-2 text-slate-700 whitespace-pre-wrap">
                {data.note}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
