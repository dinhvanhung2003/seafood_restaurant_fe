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
import { toast } from "sonner";
import { Loader2, Receipt, Lock, AlertCircle, Wallet } from "lucide-react";
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

  const isPurchaseReceipt = !!item?.purchaseReceipt;
  const isInvoice = !!item?.invoice;
  const canEdit = !isInvoice;

  const { data: prDetail, isLoading: isLoadingPR } = usePROne(
    isPurchaseReceipt && open ? item.purchaseReceipt.id : undefined
  );

  const { data: invoiceDetail, isLoading: isLoadingInv } = useInvoiceDetail(
    isInvoice && open ? item.invoice.id : undefined
  );

  const detailData = useMemo(() => {
    if (isPurchaseReceipt && prDetail) {
      return {
        total: prDetail.grandTotal,
        paid: prDetail.amountPaid,
        debt: prDetail.debt,
        code: item.purchaseReceipt.code,
        type: "Phiếu Nhập",
      };
    }
    if (isInvoice && invoiceDetail) {
      return {
        total: invoiceDetail.finalAmount,
        code: item.invoice.invoiceNumber,
        type: "Hóa Đơn",
      };
    }
    return null;
  }, [isPurchaseReceipt, prDetail, isInvoice, invoiceDetail, item]);

  const isLoadingData = isLoadingPR || isLoadingInv;

  useEffect(() => {
    if (item && open) {
      setAmount(String(Math.abs(Number(item.amount || 0))));
    }
  }, [item, open]);

  const maxAllowedAmount = useMemo(() => {
    if (!detailData) return Infinity;
    return (detailData.debt || 0) + Math.abs(Number(item.amount || 0));
  }, [detailData, item]);

  const currentVal = Number(amount);
  const isOverLimit =
    (isPurchaseReceipt || isInvoice) &&
    !isLoadingData &&
    detailData &&
    currentVal > maxAllowedAmount;
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
              className={`p-2 rounded-full ${
                item?.type === "RECEIPT"
                  ? "bg-green-100 text-green-600"
                  : "bg-rose-100 text-rose-600"
              }`}
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
                <strong>Phiếu tự động:</strong> Phiếu này sinh ra từ hóa đơn{" "}
                <b>{item.invoice.invoiceNumber}</b>. Không thể sửa thủ công để
                đảm bảo doanh thu.
              </div>
            </div>
          )}

          {(isPurchaseReceipt || isInvoice) && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 border-b text-xs font-semibold text-slate-500 uppercase flex justify-between items-center">
                <span>
                  Liên kết {detailData?.type}: {detailData?.code || "..."}
                </span>
                {detailData && (
                  <Badge
                    variant={detailData.debt > 0 ? "outline" : "secondary"}
                    className={
                      detailData.debt > 0
                        ? "text-amber-600 border-amber-600"
                        : "bg-green-100 text-green-700"
                    }
                  >
                    {detailData.debt > 0 ? "Còn nợ" : "Đã thanh toán hết"}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 p-4 gap-4 text-center divide-x">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    Tổng đơn
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
                    Đã trả
                  </div>
                  <div className="font-semibold text-green-600 text-lg">
                    {detailData ? currency(detailData.paid) : "..."}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    Còn nợ
                  </div>
                  <div className="font-semibold text-rose-600 text-lg">
                    {detailData ? currency(detailData.debt) : "..."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- CẢNH BÁO KHI HẾT NỢ --- */}
          {detailData?.debt === 0 && canEdit && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-md text-sm flex gap-2 border border-yellow-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                Phiếu này đã hoàn tất thanh toán. Bạn chỉ có thể sửa số tiền{" "}
                <strong>thấp hơn</strong> mức hiện tại để ghi nhận lại công nợ.
              </span>
            </div>
          )}

          {/* FORM NHẬP LIỆU */}
          <div className={!canEdit ? "opacity-60 pointer-events-none" : ""}>
            <div className="grid gap-6">
              {(isPurchaseReceipt || isInvoice) && detailData && (
                <div className="space-y-2">
                  <Label className="text-slate-500 text-xs uppercase font-bold">
                    Đã thanh toán (Hiện tại)
                  </Label>
                  <Input
                    disabled
                    value={currency(detailData.paid)}
                    className="bg-slate-100/50 text-slate-600 font-medium border-slate-200"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold text-slate-900">
                    Giá trị phiếu {canEdit ? "(Sửa đổi)" : ""}
                  </Label>
                  {(isPurchaseReceipt || isInvoice) && !isLoadingData && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
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
                      "pr-12 h-12 text-xl font-bold shadow-sm transition-all",
                      isOverLimit
                        ? "border-red-500 text-red-600 focus-visible:ring-red-200 bg-red-50/30"
                        : "border-slate-300 focus-visible:ring-blue-200 focus-visible:border-blue-500"
                    )}
                    disabled={!canEdit}
                    placeholder="0"
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

                <div className="min-h-[20px]">
                  {isOverLimit ? (
                    <div className="text-xs font-medium text-red-600 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Số tiền vượt quá dư nợ còn lại.
                    </div>
                  ) : amount && !isNaN(Number(amount)) ? (
                    <div className="text-xs text-slate-500 text-right">
                      {currency(Number(amount))}
                    </div>
                  ) : null}
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
            {canEdit ? "Hủy bỏ" : "Đóng"}
          </Button>

          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={updateMut.isPending || !isValid}
              className={cn(
                "h-10 min-w-[120px]",
                isOverLimit
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800"
              )}
            >
              {updateMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Lưu thay đổi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
