// components/admin/transaction/purchasereturn/modal/CreatePurchaseReturnModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Search } from "lucide-react";

import { useSuppliers } from "@/hooks/admin/useSupplier";
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

export default function CreatePurchaseReturnModal({
  open,
  onOpenChange,
  onCreated, // callback sau khi tạo xong (để đóng + reset ngoài)
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (payload: any) => void;
}) {
  // ------- Supplier search (xài hook có sẵn) -------
  const [supPage, setSupPage] = useState(1);
  const supLimit = 10;
  const [q, setQ] = useState(""); // ô tìm tên/SĐT NCC
  const { data: supData, isFetching: supLoading } = useSuppliers(supPage, supLimit, { q } as any);

  const supplierList = supData?.data ?? [];
  const [supplierId, setSupplierId] = useState<string | undefined>();

  // ------- Form header -------
  const [reason, setReason] = useState("Hàng hỏng / không đạt chất lượng");
  const [discountType, setDiscountType] = useState<"AMOUNT" | "PERCENT">("AMOUNT");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0); // chỉ áp dụng khi POSTED

  // ------- Lines -------
  const [lines, setLines] = useState<PurchaseReturnCreateLine[]>([
    { itemId: "", quantity: 1, unitPrice: 0, receivedUomCode: "KG" },
  ]);

  const addLine = () =>
    setLines((xs) => [...xs, { itemId: "", quantity: 1, unitPrice: 0, receivedUomCode: "KG" }]);
  const removeLine = (idx: number) => setLines((xs) => xs.filter((_, i) => i !== idx));
  const patchLine = (idx: number, patch: Partial<PurchaseReturnCreateLine>) =>
    setLines((xs) => xs.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const totalGoods = useMemo(() => {
    return lines.reduce((s, l) => s + (Number(l.unitPrice || 0) * Number(l.quantity || 0)), 0);
  }, [lines]);

  const discountAmount = useMemo(() => {
    const v = Number(discountValue || 0);
    if (discountType === "AMOUNT") return Math.max(0, Math.min(v, totalGoods));
    // percent
    return Math.max(0, Math.min(Math.round((totalGoods * v) / 100), totalGoods));
  }, [discountType, discountValue, totalGoods]);

  const refundAmount = useMemo(() => Math.max(0, totalGoods - discountAmount), [totalGoods, discountAmount]);

  // ------- Mutations -------
  const createPosted = useCreatePurchaseReturn();
  const createDraft = useCreatePurchaseReturnDraft();

  const disabled = !supplierId || lines.some((l) => !l.itemId || l.quantity <= 0 || l.unitPrice < 0);

  const toPayload = (posted: boolean): PurchaseReturnCreateBody => ({
    supplierId: supplierId!,
    items: lines.map((l) => ({
      itemId: l.itemId.trim(),
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      receivedUomCode: l.receivedUomCode?.trim() || undefined,
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
      // FE guard (BE cũng check)
      return alert("Số tiền NCC hoàn (paidAmount) không được vượt quá số hoàn/ghi có.");
    }
    await createPosted.mutateAsync(body);
    onCreated?.(body);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      // reset
      setSupplierId(undefined);
      setQ("");
      setReason("Hàng hỏng / không đạt chất lượng");
      setDiscountType("AMOUNT");
      setDiscountValue(0);
      setPaidAmount(0);
      setLines([{ itemId: "", quantity: 1, unitPrice: 0, receivedUomCode: "KG" }]);
      setSupPage(1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tạo phiếu trả hàng nhập</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Supplier */}
          <div className="grid gap-2">
            <Label>Nhà cung cấp</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tìm NCC theo tên/SĐT…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSupPage(1);
                }}
              />
              <Button variant="outline" onClick={() => setSupPage((p) => Math.max(1, p - 1))} disabled={supPage <= 1}>
                <Search className="w-4 h-4 mr-1" /> Trang trước
              </Button>
              <Button
                variant="outline"
                onClick={() => setSupPage((p) => p + 1)}
                disabled={supplierList.length < supLimit || supLoading}
              >
                Trang sau
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {supplierList.map((s) => (
                <Button
                  key={s.id}
                  variant={supplierId === s.id ? "default" : "secondary"}
                  className="h-9"
                  onClick={() => setSupplierId(s.id)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Lines */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Danh sách hàng trả</Label>
              <Button onClick={addLine} size="sm"><Plus className="w-4 h-4 mr-1" /> Thêm dòng</Button>
            </div>

            <ScrollArea className="max-h-64 rounded border p-2">
              <div className="space-y-3">
                {lines.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label>Mã hàng (itemId)</Label>
                      <Input
                        placeholder="uuid hàng tồn kho"
                        value={l.itemId}
                        onChange={(e) => patchLine(idx, { itemId: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Số lượng</Label>
                      <Input
                        type="number"
                        value={l.quantity}
                        onChange={(e) => patchLine(idx, { quantity: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Đơn giá</Label>
                      <Input
                        type="number"
                        value={l.unitPrice}
                        onChange={(e) => patchLine(idx, { unitPrice: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>ĐVT nhận</Label>
                      <Input
                        placeholder="KG / PCS…"
                        value={l.receivedUomCode ?? ""}
                        onChange={(e) => patchLine(idx, { receivedUomCode: e.target.value })}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => removeLine(idx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {lines.length === 0 && (
                  <div className="text-sm text-slate-500">Chưa có dòng nào.</div>
                )}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Header info */}
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <Label>Lý do</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div>
              <Label>Loại giảm</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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

          {/* Totals */}
          <div className="grid md:grid-cols-3 gap-3">
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

          {/* Paid when POSTED */}
          <div className="grid md:grid-cols-3 gap-3">
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

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCreateDraft}
              disabled={disabled || createDraft.isPending}
            >
              Lưu nháp
            </Button>
            <Button
              onClick={handleCreatePosted}
              disabled={disabled || createPosted.isPending}
            >
              Ghi nhận
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
