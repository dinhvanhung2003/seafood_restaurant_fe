// src/components/admin/transaction/purchasereturn/modals/PurchaseReturnDetailModal.tsx
"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { usePurchaseReturnDetail } from "@/hooks/admin/usePurchaseReturns";

const currency = (n?: number) => (n ?? 0).toLocaleString("vi-VN");
const dmy = (iso?: string) => (iso ? new Date(iso).toLocaleString("vi-VN") : "");

export default function PurchaseReturnDetailModal({
  id,
  open,
  onOpenChange,
}: {
  id?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data, isFetching, isError } = usePurchaseReturnDetail(id, open);

  const statusBadge = (s?: string) => {
    switch (s) {
      case "POSTED": return <Badge className="bg-blue-600">Đã ghi nhận</Badge>;
      case "REFUNDED": return <Badge className="bg-emerald-600">Đã hoàn tiền</Badge>;
      case "CANCELLED": return <Badge className="bg-rose-600">Đã hủy</Badge>;
      default: return <Badge variant="secondary">Nháp</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Phiếu trả hàng {data?.code ?? ""}</DialogTitle>
          <DialogDescription>
            {isFetching ? "Đang tải…" : `Tạo lúc: ${dmy(data?.createdAt)}`}
          </DialogDescription>
        </DialogHeader>

        {/* Header info */}
        {isFetching ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-5 w-2/5" />
          </div>
        ) : isError ? (
          <div className="text-red-600">Không tải được chi tiết.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 text-sm">
            <div><span className="text-slate-500">Nhà cung cấp:</span> <b>{data?.supplierName}</b></div>
            <div><span className="text-slate-500">Trạng thái:</span> {statusBadge(data?.status)}</div>
            <div><span className="text-slate-500">Ghi chú:</span> {data?.note || "—"}</div>
            <div><span className="text-slate-500">Cập nhật:</span> {dmy(data?.updatedAt)}</div>
          </div>
        )}

        {/* Logs table */}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[48px]">#</TableHead>
                <TableHead>Mã hàng</TableHead>
                <TableHead>Tên hàng</TableHead>
                <TableHead className="text-right w-[90px]">SL</TableHead>
                <TableHead className="text-right w-[120px]">Đơn giá</TableHead>
                <TableHead className="text-right w-[120px]">Giảm</TableHead>
                <TableHead className="text-right w-[140px]">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : (data?.logs ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500">
                    Không có dòng chi tiết
                  </TableCell>
                </TableRow>
              ) : (
                data!.logs.map((l, idx) => (
                  <TableRow key={l.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{l.itemCode}</TableCell>
                    <TableCell>{l.itemName}</TableCell>
                    <TableCell className="text-right">{l.quantity}</TableCell>
                    <TableCell className="text-right">{currency(l.unitPrice)} đ</TableCell>
                    <TableCell className="text-right">{currency(l.discount)} đ</TableCell>
                    <TableCell className="text-right font-medium">{currency(l.total)} đ</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        {!isFetching && data && (
          <div className="ml-auto w-full max-w-sm space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Tổng hàng</span>
              <span className="font-medium">{currency(data.totalGoods)} đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Giảm giá</span>
              <span className="font-medium">{currency(data.discount)} đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sau giảm</span>
              <span className="font-medium">{currency(data.totalAfterDiscount)} đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hoàn/Ghi có</span>
              <span className="font-semibold">{currency(data.refundAmount)} đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Đã trả</span>
              <span className="font-semibold">{currency(data.paidAmount)} đ</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
