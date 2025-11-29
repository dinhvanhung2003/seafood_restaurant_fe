// src/components/admin/transaction/purchasereturn/modal/CreatePurchaseReturnModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UomPicker } from "@/components/admin/inventories/inventory-item/modal/UomPicker";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  AlertCircle,
  Calculator,
  Package,
  Truck,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  Loader2,
} from "lucide-react";

import SupplierPicker from "@/components/admin/inventories/purchase/picker/SupplierPicker";
import IngredientPicker from "@/components/admin/inventories/purchase/picker/IngredientPicker";
import {
  useCreatePurchaseReturn,
  useCreatePurchaseReturnDraft,
  usePurchaseReturnDetail,
  useUpdatePurchaseReturn,
  useChangeStatusPurchaseReturn,
  type PurchaseReturnCreateBody,
  type PurchaseReturnCreateLine,
  type PurchaseReturnUpdateBody,
} from "@/hooks/admin/usePurchaseReturns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function currency(n: number | string) {
  const v = typeof n === "string" ? Number(n) : n;
  return (v ?? 0).toLocaleString("vi-VN");
}

type LineUI = PurchaseReturnCreateLine & { _name?: string; _unit?: string };

export default function CreatePurchaseReturnModal({
  open,
  onOpenChange,
  onCreated,
  editId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (payload: any) => void;
  editId?: string;
}) {
  const isEditMode = !!editId;

  const { data: originalData, isFetching: isFetchingOriginal } =
    usePurchaseReturnDetail(editId, open && isEditMode);

  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
  const [reason, setReason] = useState("Hàng hỏng / không đạt chất lượng");
  const [discountType, setDiscountType] = useState<"AMOUNT" | "PERCENT">(
    "AMOUNT"
  );
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [lines, setLines] = useState<LineUI[]>([]);

  // Load data
  useEffect(() => {
    if (isEditMode && originalData) {
      setSupplierId(originalData.supplierId);
      setReason(originalData.note || "");
      const isPercent = originalData.discountType?.toUpperCase() === "PERCENT";
      setDiscountType(isPercent ? "PERCENT" : "AMOUNT");
      setDiscountValue(
        originalData.discountValue ?? originalData.discount ?? 0
      );
      setPaidAmount(originalData.paidAmount || 0);

      const mappedLines: LineUI[] = (originalData.logs || []).map((l: any) => ({
        itemId: l.itemId,
        _name: l.itemName,
        _unit: l.uomCode || l.receivedUomCode || "KG",
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        receivedUomCode: l.receivedUomCode || l.uomCode || "KG",
      }));
      setLines(mappedLines);
    }
  }, [isEditMode, originalData]);

  // Calculation
  const totalGoods = useMemo(
    () =>
      lines.reduce(
        (s, l) => s + Number(l.unitPrice || 0) * Number(l.quantity || 0),
        0
      ),
    [lines]
  );

  const discountAmount = useMemo(() => {
    const v = Number(discountValue || 0);
    if (discountType === "AMOUNT") return Math.max(0, Math.min(v, totalGoods));
    return Math.max(
      0,
      Math.min(Math.round((totalGoods * v) / 100), totalGoods)
    );
  }, [discountType, discountValue, totalGoods]);

  const refundAmount = useMemo(
    () => Math.max(0, totalGoods - discountAmount),
    [totalGoods, discountAmount]
  );

  const isPaidAmountInvalid = paidAmount > refundAmount;

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    lines.forEach((l, idx) => {
      if (l.quantity <= 0) errs[`line_${idx}_qty`] = "SL > 0";
      if (l.unitPrice < 0) errs[`line_${idx}_price`] = "Giá >= 0";
    });

    // --- SỬA ĐOẠN NÀY ---
    if (discountType === "PERCENT" && discountValue > 100)
      errs["discount"] = "Tối đa 100%";

    // Validate cho trường hợp nhập tiền mặt
    if (discountType === "AMOUNT" && discountValue > totalGoods)
      errs["discount"] = "Giảm giá vượt quá tổng tiền";
    // --------------------

    if (isPaidAmountInvalid) errs["paid"] = "Vượt quá số tiền hoàn";
    return errs;
  }, [lines, discountType, discountValue, isPaidAmountInvalid, totalGoods]);

  const hasErrors = Object.keys(errors).length > 0;
  const disabled = !supplierId || lines.length === 0 || hasErrors;
  // When posting (Hoàn tất & Ghi sổ) require supplier immediate refund to be entered
  const requiresPaidForPosting = true; // nếu sau này muốn toggle rule, sửa biến này
  const disabledPosted =
    disabled || (requiresPaidForPosting && Number(paidAmount || 0) <= 0);

  // Hooks
  const createPostedMut = useCreatePurchaseReturn();
  const createDraftMut = useCreatePurchaseReturnDraft();
  const updateMut = useUpdatePurchaseReturn();
  const changeStatusMut = useChangeStatusPurchaseReturn();

  const isSaving =
    createPostedMut.isPending ||
    createDraftMut.isPending ||
    updateMut.isPending ||
    changeStatusMut.isPending;

  // Handlers
  const handleNumericInput = (val: string, setter: (v: number) => void) => {
    const cleanVal = val.replace(/[^0-9]/g, "");
    setter(cleanVal === "" ? 0 : Number(cleanVal));
  };

  const handleAddIngredient = (id: string, name: string, unitCode?: string) => {
    setLines((prev) => {
      if (prev.some((x) => x.itemId === id)) return prev;
      const code = unitCode ? unitCode.toUpperCase() : "";
      return [
        ...prev,
        {
          itemId: id,
          _name: name,
          _unit: code || "Chưa chọn ĐVT",
          quantity: 1,
          unitPrice: 0,
          receivedUomCode: code,
        },
      ];
    });
  };

  const addLine = () =>
    setLines((xs) => [
      ...xs,
      { itemId: "", quantity: 1, unitPrice: 0, receivedUomCode: "KG" },
    ]);
  const removeLine = (idx: number) =>
    setLines((xs) => xs.filter((_, i) => i !== idx));
  const patchLine = (idx: number, patch: Partial<LineUI>) =>
    setLines((xs) => xs.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const toPayload = (): PurchaseReturnCreateBody => {
    const currentPaid = Number(paidAmount || 0);
    const currentDebt = Math.max(0, refundAmount - currentPaid);

    return {
      supplierId: supplierId!,
      items: lines.map((l) => ({
        itemId: l.itemId.trim(),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        receivedUomCode:
          (l.receivedUomCode || l._unit || "")
            .toString()
            .trim()
            .toUpperCase() || undefined,
      })),
      reason: reason.trim(),
      discountType,
      discountValue: Number(discountValue || 0),
      paidAmount: currentPaid,

      // --- THÊM DÒNG NÀY ---
      debt: currentDebt,
    } as any; // Dùng 'as any' nếu type PurchaseReturnCreateBody chưa kịp cập nhật
  };

  // --- ACTIONS ---
  const handleSaveDraft = async () => {
    if (!supplierId) return toast.error("Vui lòng chọn nhà cung cấp");
    const payload = toPayload();
    try {
      if (isEditMode) {
        await updateMut.mutateAsync({
          id: editId!,
          ...payload,
        } as PurchaseReturnUpdateBody);
      } else {
        await createDraftMut.mutateAsync(payload);
      }
      onCreated?.(payload);
      onOpenChange(false);
    } catch (e) {}
  };

  const handleSavePosted = async () => {
    if (!supplierId) return toast.error("Vui lòng chọn nhà cung cấp");
    // Bắt buộc phải nhập NCC hoàn tiền ngay khi ghi sổ
    if (Number(paidAmount || 0) <= 0) {
      return toast.error(
        "Vui lòng nhập số tiền NCC hoàn ngay trước khi ghi sổ"
      );
    }
    const payload = toPayload();
    try {
      if (isEditMode) {
        // 1. Cập nhật dữ liệu
        await updateMut.mutateAsync({
          id: editId!,
          ...payload,
        } as PurchaseReturnUpdateBody);
        // 2. Ghi nhận (Change Status)
        // Chờ một chút để đảm bảo DB sync xong (an toàn)
        await changeStatusMut.mutateAsync({ id: editId!, status: "POSTED" });
        toast.success("Ghi nhận phiếu thành công!");
      } else {
        // Tạo mới POSTED
        await createPostedMut.mutateAsync(payload);
      }
      onCreated?.(payload);
      onOpenChange(false);
    } catch (e) {}
  };

  // Reset
  useEffect(() => {
    if (!open) {
      setSupplierId(undefined);
      setReason("Hàng hỏng / không đạt chất lượng");
      setDiscountType("AMOUNT");
      setDiscountValue(0);
      setPaidAmount(0);
      setLines([]);
    }
  }, [open]);

  if (isEditMode && isFetchingOriginal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1280px] w-[95vw] h-[90vh] p-0 gap-0 flex flex-col bg-slate-50 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="px-6 py-4 bg-white border-b flex-shrink-0 flex flex-row items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900">
                {isEditMode ? "Chỉnh sửa phiếu" : "Tạo phiếu trả hàng nhập"}
              </span>
              <span className="text-sm text-slate-500 font-normal mt-0.5">
                {isEditMode
                  ? `#${editId?.slice(0, 8)}...`
                  : "Trả lại hàng hóa & Ghi giảm công nợ NCC"}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT COL */}
            <ScrollArea className="lg:col-span-8 border-r h-full bg-slate-50/50">
              <div className="p-6 space-y-6 max-w-5xl mx-auto">
                {/* Supplier Card */}
                <div className="bg-white rounded-xl border shadow-sm p-1">
                  <div className="px-5 py-4 border-b flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-800">
                      Thông tin Nhà cung cấp
                    </h3>
                  </div>
                  <div className="p-5 flex flex-wrap gap-6">
                    <div className="space-y-2 flex-1 min-w-[280px]">
                      <Label className="text-slate-600 font-medium">
                        Chọn Nhà cung cấp (*)
                      </Label>
                      <SupplierPicker
                        supplierId={supplierId}
                        setSupplierId={(id) => {
                          if (
                            lines.length > 0 &&
                            id !== supplierId &&
                            !confirm("Đổi NCC sẽ reset dòng hàng?")
                          )
                            return;
                          setSupplierId(id);
                        }}
                        onOpenAddSupplier={() => {}}
                      />
                    </div>
                    <div
                      className={`space-y-2 flex-1 min-w-[280px] ${
                        !supplierId
                          ? "opacity-50 pointer-events-none grayscale"
                          : ""
                      }`}
                    >
                      <Label className="text-slate-600 font-medium">
                        Tìm hàng để trả
                      </Label>
                      <IngredientPicker
                        supplierId={supplierId}
                        onAdd={handleAddIngredient}
                        onOpenAddIngredient={() => {}}
                      />
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                  <div className="px-5 py-3 border-b bg-white flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-slate-800">
                        Chi tiết hàng trả{" "}
                        <Badge variant="secondary" className="ml-2">
                          {lines.length}
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={addLine} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1.5" /> Thêm dòng
                    </Button>
                  </div>

                  <div className="flex-1 w-full">
                    <div className="divide-y divide-slate-100">
                      {lines.map((l, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-4 px-5 py-3 items-start hover:bg-blue-50/30"
                        >
                          <div className="col-span-5 pt-1.5">
                            <div className="font-medium text-sm text-slate-800 line-clamp-1">
                              {l._name || "Chưa chọn SP"}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 inline-block bg-slate-100 px-1.5 rounded-sm">
                              {l.itemId}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="text"
                              inputMode="numeric"
                              className={cn(
                                "text-right h-9 font-semibold",
                                errors[`line_${idx}_qty`] && "border-red-500"
                              )}
                              value={l.quantity}
                              onChange={(e) =>
                                handleNumericInput(e.target.value, (v) =>
                                  patchLine(idx, { quantity: v })
                                )
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <UomPicker
                              value={(l.receivedUomCode || "").toUpperCase()}
                              onChange={(code) =>
                                patchLine(idx, { receivedUomCode: code })
                              }
                            />
                          </div>
                          <div className="col-span-3 flex gap-2 pl-2 relative">
                            <div className="flex-1 text-right">
                              <Input
                                type="text"
                                inputMode="numeric"
                                className={cn(
                                  "text-right h-9 font-semibold",
                                  errors[`line_${idx}_price`] &&
                                    "border-red-500"
                                )}
                                value={l.unitPrice}
                                onChange={(e) =>
                                  handleNumericInput(e.target.value, (v) =>
                                    patchLine(idx, { unitPrice: v })
                                  )
                                }
                              />
                              <div className="text-[10px] text-slate-500 mt-1 font-medium absolute right-12 -bottom-4">
                                {currency(
                                  Number(l.unitPrice) * Number(l.quantity)
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-400 hover:text-red-500"
                              onClick={() => removeLine(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* RIGHT COL - FINANCIALS */}
            <div className="lg:col-span-4 bg-white h-full flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 relative">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg text-slate-800">
                      Thanh toán
                    </span>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label>Lý do trả hàng</Label>
                      <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                      <Label>Chiết khấu / Giảm giá</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={discountType}
                          onValueChange={(v) => setDiscountType(v as any)}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AMOUNT">Theo tiền</SelectItem>
                            <SelectItem value="PERCENT">Theo %</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={discountValue}
                          onChange={(e) => {
                            // Xử lý chặn nhập liệu thông minh
                            let val = Number(
                              e.target.value.replace(/[^0-9]/g, "")
                            );

                            // Nếu là % thì chặn luôn không cho nhập > 100
                            if (discountType === "PERCENT" && val > 100) {
                              val = 100;
                            }
                            setDiscountValue(val);
                          }}
                          className={cn(
                            "bg-white text-right font-semibold",
                            // Hiển thị viền đỏ nếu có lỗi
                            errors["discount"] &&
                              "border-red-500 text-red-600 focus-visible:ring-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Tổng tiền</span>
                      <span className="font-medium">
                        {currency(totalGoods)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Giảm trừ</span>
                      <span className="font-medium text-green-600">
                        -{currency(discountAmount)}
                      </span>
                    </div>
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex justify-between items-center">
                      <span className="font-bold text-rose-700">
                        Cần hoàn tiền
                      </span>
                      <span className="font-bold text-2xl text-rose-700">
                        {currency(refundAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Label className="flex justify-between mb-2">
                      <span>NCC hoàn tiền</span>
                      {isPaidAmountInvalid && (
                        <Badge variant="destructive">Lỗi</Badge>
                      )}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={paidAmount}
                      onChange={(e) =>
                        handleNumericInput(e.target.value, setPaidAmount)
                      }
                      className={cn(
                        "text-right font-bold text-lg",
                        isPaidAmountInvalid && "border-red-500 text-red-600"
                      )}
                    />
                    {isPaidAmountInvalid && (
                      <div className="text-xs text-red-500 text-right mt-1">
                        Không được lớn hơn {currency(refundAmount)}
                      </div>
                    )}

                    {Number(paidAmount || 0) <= 0 && (
                      <div className="text-xs text-red-500 text-right mt-1">
                        Vui lòng nhập số tiền NCC hoàn ngay để có thể ghi sổ
                      </div>
                    )}

                    {/* --- THÊM ĐOẠN HIỂN THỊ CÔNG NỢ --- */}
                    <div className="flex justify-between text-sm mt-3 pt-3 border-t border-dashed">
                      <span className="text-slate-600 font-medium">
                        Tính công nợ (ghi giảm):
                      </span>
                      <span className="font-bold text-slate-900">
                        {currency(Math.max(0, refundAmount - paidAmount))}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-white flex flex-col gap-3 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)]">
                <Button
                  onClick={handleSavePosted}
                  disabled={disabledPosted || isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 font-semibold"
                >
                  {isSaving && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isEditMode ? "Ghi nhận & Cập nhật" : "Hoàn tất & Ghi sổ"}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="h-10"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleSaveDraft}
                    disabled={disabled || isSaving}
                    className="h-10"
                  >
                    {isSaving && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {isEditMode ? "Cập nhật nháp" : "Lưu nháp"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
