"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStockInIngredient } from "@/hooks/admin/useIngredients";
import { toast } from "sonner";

export type AddIngredientModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** callback khi lưu thành công (trả về nguyên liệu vừa tạo) */
  onSaved?: (ing: { id: string; name: string; unit: string }) => void;
  /** giá trị mặc định khi mở (tuỳ trang gọi) */
  defaults?: Partial<{
    name: string;
    unit: string;
    quantity: number;
    alertThreshold: number;
    description: string;
  }>;
};

export default function AddIngredientModal({
  open,
  onOpenChange,
  onSaved,
  defaults,
}: AddIngredientModalProps) {
  const stockIn = useStockInIngredient();

  const [form, setForm] = React.useState({
    name: defaults?.name ?? "",
    unit: defaults?.unit ?? "kg",
    quantity: defaults?.quantity ?? 0,
    alertThreshold: defaults?.alertThreshold ?? 0,
    description: defaults?.description ?? "",
  });

  // reset khi mở lại modal (để nhận defaults mới)
  React.useEffect(() => {
    if (open) {
      setForm({
        name: defaults?.name ?? "",
        unit: defaults?.unit ?? "kg",
        quantity: defaults?.quantity ?? 0,
        alertThreshold: defaults?.alertThreshold ?? 0,
        description: defaults?.description ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Tên nguyên liệu không được trống");
    if (!form.unit.trim()) return toast.error("Đơn vị không được trống");
    if (Number.isNaN(+form.quantity) || +form.quantity < 0) {
      return toast.error("Số lượng không hợp lệ");
    }
    if (Number.isNaN(+form.alertThreshold) || +form.alertThreshold < 0) {
      return toast.error("Ngưỡng cảnh báo không hợp lệ");
    }

    try {
      const res = await stockIn.mutateAsync({
        name: form.name.trim(),
        unit: form.unit.trim(),
        quantity: +form.quantity,
        alertThreshold: +form.alertThreshold,
        description: form.description?.trim() || undefined,
      });
      toast.success("Đã nhập kho nguyên liệu");
      onOpenChange(false);
      onSaved?.({ id: (res as any).id, name: (res as any).name, unit: (res as any).unit });
    } catch {
      toast.error("Nhập kho thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nhập kho nguyên liệu</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <Field label="Tên">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ví dụ: Tôm hùm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Đơn vị">
              <Input
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="kg, chai, thùng…"
              />
            </Field>
            <Field label="Số lượng">
              <Input
                type="number"
                value={form.quantity}
                min={0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngưỡng cảnh báo">
              <Input
                type="number"
                value={form.alertThreshold}
                min={0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, alertThreshold: Number(e.target.value) }))
                }
              />
            </Field>
            <div className="flex items-end">
              <span className="text-xs text-muted-foreground">
                Báo động khi tồn &le; ngưỡng
              </span>
            </div>
          </div>

          <Field label="Mô tả">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ghi chú chất lượng, lô nhập, ..."
            />
          </Field>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={stockIn.isPending}>
            {stockIn.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["space-y-1", className].filter(Boolean).join(" ")}>
      <Label className="text-[13px]">{label}</Label>
      {children}
    </div>
  );
}
