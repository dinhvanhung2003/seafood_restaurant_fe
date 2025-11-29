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
import { useUpdateCashbookEntry } from "@/hooks/admin/useCashBook";
import { usePROne } from "@/hooks/admin/usePurchase";
import { useInvoiceDetail } from "@/hooks/admin/useInvoice";
import { usePurchaseReturnDetail } from "@/hooks/admin/usePurchaseReturns";
import { toast } from "sonner";
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
  const updateMut = useUpdateCashbookEntry();
  const [amount, setAmount] = useState("");

  // --- 1. NHẬN DIỆN LOẠI PHIẾU ---
  const isPurchaseReceipt =
    !!item?.purchaseReceipt || item?.refType === "PURCHASE_RECEIPT";
  const isInvoice =
    !!item?.invoice || item?.refType === "INVOICE" || item?.refType === "ORDER";
  // Quan trọng: Backend đã trả về object purchaseReturn, nên check !!item?.purchaseReturn là đủ
  const isPurchaseReturn =
    !!item?.purchaseReturn || item?.refType === "PURCHASE_RETURN";

  const canEdit = !isInvoice;

  // 🔥 [FIX]: Đưa biến hasLink lên đây để dùng được ở bên dưới
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
      // Ưu tiên lấy từ API detail, nếu chưa load xong hoặc lỗi thì fallback về data có sẵn trong item list
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
      // Backend trả về debt, hoặc tự tính
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

  // Reset form
  useEffect(() => {
    if (item && open) {
      setAmount(String(Math.abs(Number(item.amount || 0))));
    }
  }, [item, open]);

  // --- 5. LOGIC VALIDATION ---
  const maxAllowedAmount = useMemo(() => {
    if (!detailData) return Infinity;
    const currentEntryAmount = Math.abs(Number(item.amount || 0));
    return (detailData.debt || 0) + currentEntryAmount;
  }, [detailData, item]);

  const currentVal = Number(amount);

  // 🔥 [FIX]: hasLink bây giờ đã được định nghĩa ở trên nên dùng được ở đây
  const isOverLimit =
    hasLink && !isLoadingData && detailData
      ? currentVal > maxAllowedAmount + 10
      : false;

  const isValid = currentVal > 0 && !isOverLimit;

  const handleSave = async () => {
    if (!item || !canEdit) return;
    if (!amount || amount.trim() === "")
      return toast.error("Vui lòng nhập số tiền");
    const val = Number(amount);
    if (isNaN(val)) return toast.error("Giá trị phải là số");
    if (val <= 0) return toast.error("Số tiền phải lớn hơn 0");

    if (isOverLimit) {
      return toast.error(
        `Số tiền vượt quá dư nợ (Max: ${currency(maxAllowedAmount)})`
      );
    }

    try {
      await updateMut.mutateAsync({
        id: item.id,
        data: {
          amount: item.type === "PAYMENT" ? -val : val,
        },
      });
      toast.success("Cập nhật phiếu thành công");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Cập nhật thất bại");
    }
  };

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
                {canEdit ? "Chỉnh sửa phiếu" : "Chi tiết phiếu"}
              </span>
              <span className="font-bold">
                {item?.type === "RECEIPT" ? "Thu tiền" : "Chi tiền"} #
                {item?.code}
              </span>
            </div>
            {!canEdit && (
              <Badge variant="secondary" className="ml-auto flex gap-1">
                <Lock className="w-3 h-3" /> Chỉ xem
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {isInvoice && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md flex gap-3 items-start text-sm text-blue-800">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <strong>Phiếu tự động:</strong> Phiếu sinh từ hóa đơn{" "}
                <b>{item.invoice?.invoiceNumber || item.refCode}</b>. Không thể
                sửa.
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

          {detailData?.isDebtCleared && canEdit && (
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm flex gap-2 border border-yellow-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                Phiếu đã hoàn tất thanh toán. Bạn chỉ có thể sửa số tiền{" "}
                <strong>thấp hơn</strong> mức hiện tại.
              </span>
            </div>
          )}

          <div className={!canEdit ? "opacity-60 pointer-events-none" : ""}>
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
                    Giá trị phiếu (Sửa đổi)
                  </Label>
                  {hasLink && !isLoadingData && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-medium">
                      Max: {currency(maxAllowedAmount)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={cn(
                      "pr-12 h-12 text-xl font-bold shadow-sm",
                      isOverLimit
                        ? "border-red-500 text-red-600 bg-red-50/30"
                        : "border-slate-300"
                    )}
                    disabled={!canEdit}
                    autoFocus
                  />
                  <div
                    className={cn(
                      "absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-sm",
                      isOverLimit ? "text-red-400" : "text-slate-400"
                    )}
                  >
                    VNĐ
                  </div>
                </div>
                {isOverLimit && (
                  <div className="text-xs font-medium text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Số tiền vượt quá dư
                    nợ tối đa.
                  </div>
                )}
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
            {canEdit ? "Hủy bỏ" : "Đóng"}
          </Button>
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={updateMut.isPending || !isValid}
              className={cn(
                "h-10 min-w-[120px]",
                isOverLimit ? "opacity-50" : "bg-slate-900"
              )}
            >
              {updateMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Lưu thay đổi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
