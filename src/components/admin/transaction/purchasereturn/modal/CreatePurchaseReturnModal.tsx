"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";

import SupplierPicker from "@/components/admin/inventories/purchase/picker/SupplierPicker";
import IngredientPicker from "@/components/admin/inventories/purchase/picker/IngredientPicker";
import {
  useCreatePurchaseReturn,
  useCreatePurchaseReturnDraft,
  type PurchaseReturnCreateBody,
  type PurchaseReturnCreateLine,
} from "@/hooks/admin/usePurchaseReturns";

function currency(n: number | string) {
  const v = typeof n === "string" ? Number(n) : n;
  return (v ?? 0).toLocaleString("vi-VN");
}

type LineUI = PurchaseReturnCreateLine & { _name?: string; _unit?: string }; // _unit = unitCode

export default function CreatePurchaseReturnModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (payload: any) => void;
}) {
  // ------- Header form -------
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
  const [reason, setReason] = useState("Hàng hỏng / không đạt chất lượng");
  const [discountType, setDiscountType] = useState<"AMOUNT" | "PERCENT">("AMOUNT");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // ------- Lines -------
  const [lines, setLines] = useState<LineUI[]>([]);

  // nhận unitCode từ IngredientPicker
  const handleAddIngredient = (id: string, name: string, unitCode?: string) => {
    setLines((prev) => {
      if (prev.some((x) => x.itemId === id)) return prev; // tránh trùng
      const code = (unitCode || "KG").toUpperCase();
      return [
        ...prev,
        {
          itemId: id,
          _name: name,
          _unit: code,                  // lưu code để hiển thị & fallback
          quantity: 1,
          unitPrice: 0,
          receivedUomCode: code,        // gửi code cho BE
        },
      ];
    });
  };

  const addLine = () =>
    setLines((xs) => [...xs, { itemId: "", quantity: 1, unitPrice: 0, receivedUomCode: "KG" }]);
  const removeLine = (idx: number) => setLines((xs) => xs.filter((_, i) => i !== idx));
  const patchLine = (idx: number, patch: Partial<LineUI>) =>
    setLines((xs) => xs.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  // ------- Totals -------
  const totalGoods = useMemo(
    () => lines.reduce((s, l) => s + Number(l.unitPrice || 0) * Number(l.quantity || 0), 0),
    [lines]
  );

  const discountAmount = useMemo(() => {
    const v = Number(discountValue || 0);
    if (discountType === "AMOUNT") return Math.max(0, Math.min(v, totalGoods));
    return Math.max(0, Math.min(Math.round((totalGoods * v) / 100), totalGoods));
  }, [discountType, discountValue, totalGoods]);

  const refundAmount = useMemo(
    () => Math.max(0, totalGoods - discountAmount),
    [totalGoods, discountAmount]
  );

  // ------- Mutations -------
  const createPosted = useCreatePurchaseReturn();
  const createDraft = useCreatePurchaseReturnDraft();

  const disabled =
    !supplierId || lines.length === 0 || lines.some((l) => !l.itemId || l.quantity <= 0 || l.unitPrice < 0);

  const toPayload = (posted: boolean): PurchaseReturnCreateBody => ({
    supplierId: supplierId!,
    items: lines.map((l) => ({
      itemId: l.itemId.trim(),
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      // luôn gửi UOM CODE in UPPERCASE; fallback về _unit (code) nếu input trống
      receivedUomCode:
        (l.receivedUomCode || l._unit || "")
          .toString()
          .trim()
          .toUpperCase() || undefined,
    })),
    reason: reason.trim(),
    discountType,
    discountValue: Number(discountValue || 0),
    paidAmount: posted ? Number(paidAmount || 0) : 0,
  });

  const handleCreateDraft = async () => {
    const body = toPayload(false);
    await createDraft.mutateAsync(body);
    onCreated?.(body);
    onOpenChange(false);
  };

  const handleCreatePosted = async () => {
    const body = toPayload(true);
    if (body.paidAmount! > refundAmount) {
      alert("Số tiền NCC hoàn (paidAmount) không được vượt quá số hoàn/ghi có.");
      return;
    }
    await createPosted.mutateAsync(body);
    onCreated?.(body);
    onOpenChange(false);
  };

  // Reset khi đóng modal
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[95vw]
          sm:max-w-3xl md:max-w-5xl lg:max-w-6xl xl:max-w-[1200px]
          p-0
        "
      >
        <div className="max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-4 pt-4 md:px-6">
            <DialogTitle>Tạo phiếu trả hàng nhập</DialogTitle>
          </DialogHeader>

          <div className="px-4 md:px-6 pb-3 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SupplierPicker
                supplierId={supplierId}
                setSupplierId={(id) => {
                  if (lines.length > 0 && id !== supplierId) {
                    const ok = confirm("Đổi nhà cung cấp sẽ không lọc lại các dòng đã thêm. Tiếp tục?");
                    if (!ok) return;
                  }
                  setSupplierId(id);
                }}
                onOpenAddSupplier={() => {}}
              />

              <IngredientPicker
                supplierId={supplierId}
                onAdd={handleAddIngredient}
                onOpenAddIngredient={() => {}}
              />
            </div>

            <Separator />

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Danh sách hàng trả</Label>
                <Button onClick={addLine} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Thêm dòng
                </Button>
              </div>

              <ScrollArea className="h-[38vh] md:h-[45vh] rounded border p-2">
                <div className="space-y-3">
                  {lines.map((l, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                      <div className="md:col-span-4">
                        <Label>Hàng trả</Label>
                        <div className="rounded-md border p-2">
                          <div className="font-medium">{l._name ?? "—"}</div>
                          <div className="text-xs text-slate-500 break-all">{l.itemId}</div>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label>Số lượng</Label>
                        <Input
                          type="number"
                          value={l.quantity}
                          onChange={(e) => patchLine(idx, { quantity: Number(e.target.value) })}
                          min={0}
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Label>Đơn giá</Label>
                        <Input
                          type="number"
                          value={l.unitPrice}
                          onChange={(e) => patchLine(idx, { unitPrice: Number(e.target.value) })}
                          min={0}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>ĐVT nhận</Label>
                        <Input
                          placeholder="KG / PCS…"
                          value={(l.receivedUomCode ?? l._unit ?? "").toString().toUpperCase()}
                          onChange={(e) =>
                            patchLine(idx, { receivedUomCode: e.target.value.toUpperCase() })
                          }
                        />
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-rose-600"
                          onClick={() => removeLine(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {lines.length === 0 && (
                    <div className="text-sm text-slate-500">
                      Chưa có dòng nào. Hãy chọn từ danh sách nguyên liệu bên trên.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Label>Lý do</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>

              <div>
                <Label>Loại giảm</Label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">Theo số tiền</SelectItem>
                    <SelectItem value="PERCENT">Theo %</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Giá trị giảm</Label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-sm text-slate-500">Tổng tiền hàng</div>
                <div className="text-lg font-semibold">{currency(totalGoods)} đ</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm text-slate-500">Giảm (phân bổ)</div>
                <div className="text-lg font-semibold">{currency(discountAmount)} đ</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm text-slate-500">Hoàn/Ghi có</div>
                <div className="text-lg font-semibold">{currency(refundAmount)} đ</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Label>NCC đã hoàn (khi ghi nhận)</Label>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  min={0}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Chỉ áp dụng khi bấm “Ghi nhận”. Không vượt quá {currency(refundAmount)} đ.
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-white/85 backdrop-blur border-t px-4 md:px-6 py-3 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCreateDraft}
              disabled={disabled || createDraft.isPending}
            >
              Lưu nháp
            </Button>
            <Button onClick={handleCreatePosted} disabled={disabled || createPosted.isPending}>
              Ghi nhận
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
