"use client";
import React, { useEffect, useState, useMemo } from "react";
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
import { usePROne } from "@/hooks/admin/usePurchase";
import { useInvoiceDetail } from "@/hooks/admin/useInvoice";
import { usePurchaseReturnDetail } from "@/hooks/admin/usePurchaseReturns";
import {
  Loader2,
  Receipt,
  Lock,
  AlertCircle,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const currency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    v
  );

export function EditCashbookModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: any;
}) {
  const [amount, setAmount] = useState("");

  // --- 1. NHẬN DIỆN LOẠI PHIẾU ---
  const isPurchaseReceipt =
    !!item?.purchaseReceipt || item?.refType === "PURCHASE_RECEIPT";
  const isInvoice =
    !!item?.invoice || item?.refType === "INVOICE" || item?.refType === "ORDER";
  const isPurchaseReturn =
    !!item?.purchaseReturn || item?.refType === "PURCHASE_RETURN";

  const hasLink = isPurchaseReceipt || isInvoice || isPurchaseReturn;

  // --- 2. LẤY ID ---
  const prId =
    item?.purchaseReceipt?.id || (isPurchaseReceipt ? item?.refId : undefined);
  const invId = item?.invoice?.id || (isInvoice ? item?.refId : undefined);
  const returnId =
    item?.purchaseReturn?.id || (isPurchaseReturn ? item?.refId : undefined);

  // --- 3. GỌI HOOK ---
  const { data: prDetail, isLoading: isLoadingPR } = usePROne(
    isPurchaseReceipt && open ? prId : undefined
  );
  const { data: invoiceDetail, isLoading: isLoadingInv } = useInvoiceDetail(
    isInvoice && open ? invId : undefined
  );
  const { data: returnDetail, isLoading: isLoadingReturn } =
    usePurchaseReturnDetail(isPurchaseReturn && open ? returnId : undefined);

  const isLoadingData = isLoadingPR || isLoadingInv || isLoadingReturn;

  // --- 4. CHUẨN HÓA DỮ LIỆU ---
  const detailData = useMemo(() => {
    // A. Phiếu Nhập
    if (isPurchaseReceipt) {
      const src = prDetail || item?.purchaseReceipt;
      if (!src) return null;
      return {
        total: Number(src.grandTotal || 0),
        paid: Number(src.amountPaid || 0),
        debt: Number(src.debt || 0),
        code: src.code,
        type: "Phiếu Nhập",
        refCode: src.code,
        isDebtCleared: Number(src.debt || 0) <= 0,
      };
    }
    // B. Hóa Đơn
    if (isInvoice) {
      const src = invoiceDetail || item?.invoice;
      if (!src) return null;
      const total = Number(src.finalAmount || 0);
      const status = src.status;
      const paid = status === "PAID" ? total : Number(src.amountPaid || 0);
      const debt = total - paid;

      return {
        total,
        paid,
        debt,
        code: src.invoiceNumber,
        type: "Hóa Đơn",
        refCode: src.invoiceNumber,
        isDebtCleared: status === "PAID" || debt <= 0,
      };
    }
    // C. Trả Hàng
    if (isPurchaseReturn) {
      const src = returnDetail || item?.purchaseReturn;
      if (!src) return null;

      const totalRefund = Number(src.refundAmount || 0);
      const received = Number(src.paidAmount || 0);
      const remaining =
        src.debt !== undefined ? Number(src.debt) : totalRefund - received;

      return {
        total: totalRefund,
        paid: received,
        debt: Math.max(0, remaining),
        code: src.code,
        type: "Trả Hàng",
        refCode: src.code,
        isDebtCleared: remaining <= 0,
      };
    }
    return null;
  }, [
    isPurchaseReceipt,
    prDetail,
    isInvoice,
    invoiceDetail,
    isPurchaseReturn,
    returnDetail,
    item,
  ]);

  // Reset form (chỉ để hiển thị)
  useEffect(() => {
    if (item && open) {
      setAmount(String(Math.abs(Number(item.amount || 0))));
    }
  }, [item, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 bg-slate-50/50 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div
              className={cn(
                "p-2 rounded-full",
                item?.type === "RECEIPT"
                  ? "bg-green-100 text-green-600"
                  : "bg-rose-100 text-rose-600"
              )}
            >
              {item?.type === "RECEIPT" ? (
                <Wallet className="w-5 h-5" />
              ) : (
                <Receipt className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-normal text-muted-foreground">
                Chi tiết phiếu
              </span>
              <span className="font-bold">
                {item?.type === "RECEIPT" ? "Thu tiền" : "Chi tiền"} #
                {item?.code}
              </span>
            </div>
            <Badge variant="secondary" className="ml-auto flex gap-1">
              <Lock className="w-3 h-3" /> Chỉ xem
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {isInvoice && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md flex gap-3 items-start text-sm text-blue-800">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <strong>Phiếu tự động:</strong> Phiếu sinh từ hóa đơn{" "}
                <b>{item?.invoice?.invoiceNumber || item?.refCode}</b>. Không
                thể chỉnh sửa.
              </div>
            </div>
          )}

          {/* CHI TIẾT PHIẾU */}
          {hasLink && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 border-b text-xs font-semibold text-slate-500 uppercase flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Liên kết {detailData?.type}: {detailData?.refCode || "..."}
                </span>
                {detailData && (
                  <Badge
                    variant={
                      !detailData.isDebtCleared ? "outline" : "secondary"
                    }
                    className={
                      !detailData.isDebtCleared
                        ? "text-amber-600 border-amber-600 bg-amber-50"
                        : "bg-green-100 text-green-700 hover:bg-green-200 border-transparent"
                    }
                  >
                    {!detailData.isDebtCleared
                      ? "Chưa hoàn tất"
                      : "Đã hoàn tất"}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 p-4 gap-4 text-center divide-x">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    Tổng giá trị
                  </div>
                  <div className="font-semibold text-slate-900 text-lg">
                    {detailData ? (
                      currency(detailData.total)
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    {item?.type === "RECEIPT" ? "Đã thu" : "Đã trả"}
                  </div>
                  <div className="font-semibold text-green-600 text-lg">
                    {detailData ? currency(detailData.paid) : "..."}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    Còn lại
                  </div>
                  <div className="font-semibold text-rose-600 text-lg">
                    {detailData ? currency(detailData.debt) : "..."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORM CHỈ XEM */}
          <div className="opacity-70 pointer-events-none">
            <div className="grid gap-6">
              {hasLink && detailData && (
                <div className="space-y-2">
                  <Label className="text-slate-500 text-xs uppercase font-bold">
                    Đã thanh toán (Thực tế hệ thống)
                  </Label>
                  <Input
                    disabled
                    value={currency(detailData.paid)}
                    className="bg-slate-100/50 text-slate-600 font-medium"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold text-slate-900">
                    Giá trị phiếu
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    readOnly
                    disabled
                    className="pr-12 h-12 text-xl font-bold shadow-sm bg-slate-100/60 border-slate-300"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm text-slate-400">
                    VNĐ
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300 h-10"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
