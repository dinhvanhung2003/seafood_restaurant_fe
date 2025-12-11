"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoiceDetail } from "@/hooks/admin/useInvoice";

const currency = (n: number | string) => Number(n ?? 0).toLocaleString("vi-VN");

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoiceId?: string;
};

export default function InvoiceDetailDialog({
  open,
  onOpenChange,
  invoiceId,
}: Props) {
  // Khi đóng modal, tránh gọi API thừa
  const enabled = open && !!invoiceId;
  const { data, isLoading, isError } = useInvoiceDetail(invoiceId, { enabled });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 
        p-0 để tự canh padding; 
        max-w-5xl theo ảnh bạn gửi; 
        chứa nội dung trong khối cuộn riêng để không cuộn nền. 
      */}
      <DialogContent className="max-w-5xl p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>Chi tiết hóa đơn</DialogTitle>
        </DialogHeader>

        {/* Khối cuộn riêng: cao tối đa 80vh, tránh cắt bảng */}
        <div className="max-h-[80vh] overflow-y-auto px-5 pb-5">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-60" />
              <Skeleton className="h-5 w-80" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : isError || !data ? (
            <div className="text-sm text-red-600">
              Không tải được chi tiết hóa đơn.
            </div>
          ) : (
            <>
              {/* Info row */}
              <div className="grid grid-cols-4 gap-3 text-sm">
                <Info label="Mã HĐ" value={data.invoiceNumber} />
                <Info
                  label="Thời gian"
                  value={new Date(data.createdAt).toLocaleString()}
                />
                <Info label="Bàn" value={data.table?.name ?? "—"} />
                <Info label="Khách" value={data.customer?.name ?? "Khách lẻ"} />
                <Info label="Số khách" value={data.guestCount ?? "—"} />
                <Info label="Trạng thái" value={data.status} />
              </div>

              {/* Items */}
              <div className="mt-3 rounded-lg border overflow-x-auto">
                <table className="min-w-[720px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Tên hàng</Th>
                      <Th className="text-right">SL</Th>
                      <Th className="text-right">Đơn giá</Th>
                      <Th className="text-right">Thành tiền</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((row: any) => (
                      <tr key={row.id} className="border-t">
                        <Td>{row.name}</Td>
                        <Td className="text-right">{row.qty}</Td>
                        <Td className="text-right">
                          {currency(row.unitPrice)}
                        </Td>
                        <Td className="text-right">
                          {currency(row.lineTotal)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-4 gap-3 text-sm mt-3">
                <Info
                  label="Tổng tiền hàng"
                  value={currency(data.totalAmount)}
                />
                <Info label="Đã thu (TM)" value={currency(data.paidCash)} />
                <Info label="Đã thu (NH)" value={currency(data.paidBank)} />
                <Info label="Khách cần trả" value={currency(data.remaining)} />
              </div>

              {/* Payments */}
              <div className="mt-4">
                <div className="font-medium mb-1">Lịch sử thanh toán</div>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="min-w-[720px] text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <Th>Phương thức</Th>
                        <Th>Mã tham chiếu</Th>
                        <Th>Trạng thái</Th>
                        <Th className="text-right">Số tiền</Th>
                        <Th>Thời gian</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.length > 0 ? (
                        data.payments.map((p: any) => (
                          <tr key={p.id} className="border-t">
                            <Td>
                              {p.method === "CASH"
                                ? "Tiền mặt"
                                : p.method === "VIETQR"
                                ? "VietQR"
                                : p.method}
                            </Td>
                            <Td>{p.txnRef ?? "—"}</Td>
                            <Td>{p.status}</Td>
                            <Td className="text-right">{currency(p.amount)}</Td>
                            <Td>{new Date(p.createdAt).toLocaleString()}</Td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <Td
                            colSpan={5}
                            className="py-4 text-center text-slate-500"
                          >
                            Chưa có thanh toán
                          </Td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Th({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th
      className={["px-3 py-2 text-left font-medium", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className,
  colSpan,
}: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return (
    <td
      className={["px-3 py-2", className].filter(Boolean).join(" ")}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium truncate">{String(value)}</div>
    </div>
  );
}
