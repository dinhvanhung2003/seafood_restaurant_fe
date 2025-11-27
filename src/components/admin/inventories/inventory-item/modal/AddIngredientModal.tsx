"use client";

import * as React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useStockInIngredient } from "@/hooks/admin/useIngredients";
import { toast } from "sonner";
import { useCategoriesQuery } from "@/hooks/admin/useCategory";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useUomsQuery } from "@/hooks/admin/useUnitsOfMeasure";
import { UomPicker } from "./UomPicker";

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      {children}
    </div>
  );
}

export type AddIngredientModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (ing: { id: string; name: string; unit: string }) => void;
  defaults?: Partial<{
    name: string;
    unit: string;
    alertThreshold: number;
    description: string;
    categoryId: string;
  }>;
};

export default function AddIngredientModal({
  open,
  onOpenChange,
  onSaved,
  defaults,
}: AddIngredientModalProps) {
  const stockIn = useStockInIngredient();
  const { data: uomList } = useUomsQuery({
    page: 1,
    limit: 10,
    sortBy: "code",
    sortDir: "ASC",
    isActive: true,
  });
  const { data: catList } = useCategoriesQuery({
    type: "INGREDIENT",
    isActive: "true",
    page: 1,
    limit: 10,
  });
  const [form, setForm] = React.useState({
    name: defaults?.name ?? "",
    unit: (defaults?.unit ?? "").toUpperCase(),
    alertThreshold: String(defaults?.alertThreshold ?? 0),
    description: defaults?.description ?? "",
    categoryId: (defaults?.categoryId as string | undefined) ?? undefined,
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        name: defaults?.name ?? "",
        unit: (defaults?.unit ?? "").toUpperCase(),
        alertThreshold: String(defaults?.alertThreshold ?? 0),
        description: defaults?.description ?? "",
        categoryId: (defaults?.categoryId as string | undefined) ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (open && !form.unit && (uomList?.data?.length ?? 0) > 0) {
      setForm((f) => ({ ...f, unit: uomList!.data[0].code }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, uomList]);

  // --- HÀM VALIDATE VÀ SUBMIT ---
  const submit = async () => {
    // 1. Validate Tên: Không rỗng, chỉ chứa chữ/số/khoảng trắng (hỗ trợ Tiếng Việt), không ký tự đặc biệt
    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) {
      return toast.error("Tên nguyên liệu không được để trống");
    }
    // Regex: \p{L} là chữ cái (unicode), \p{N} là số, \s là khoảng trắng. /u để hỗ trợ unicode
    if (!/^[\p{L}\p{N}\s]+$/u.test(nameTrimmed)) {
      return toast.error(
        "Tên chỉ được chứa chữ cái và số, không chứa ký tự đặc biệt"
      );
    }

    // 2. Validate Đơn vị và Loại: Bắt buộc chọn
    if (!form.unit || !form.unit.trim()) {
      return toast.error("Vui lòng chọn đơn vị tính");
    }
    if (!form.categoryId) {
      return toast.error("Vui lòng chọn loại nguyên liệu");
    }

    // 3. Validate Ngưỡng cảnh báo: Số dương, rỗng thì về 0
    let alertNum = 0;
    const alertStr = form.alertThreshold.trim();
    if (alertStr !== "") {
      if (!/^\d+(\.\d+)?$/.test(alertStr)) {
        return toast.error("Ngưỡng cảnh báo phải là số hợp lệ");
      }
      alertNum = parseFloat(alertStr);
      if (alertNum < 0) {
        return toast.error("Ngưỡng cảnh báo không được âm");
      }
    }

    // 5. Validate Mô tả (Length <= 255)
    if (form.description && form.description.length > 255) {
      return toast.error("Mô tả không được vượt quá 255 ký tự");
    }

    try {
      const res = await stockIn.mutateAsync({
        name: nameTrimmed,
        unit: form.unit.trim(),
        alertThreshold: alertNum, // Gửi 0 nếu rỗng
        description: form.description?.trim() || undefined,
        categoryId: form.categoryId!,
      });
      const data = (res as any)?.data ?? res;
      toast.success("Đã tạo nguyên liệu mới");
      onOpenChange(false);
      onSaved?.({ id: data?.id, name: data?.name, unit: data?.baseUom?.code });
    } catch {
      toast.error("Tạo nguyên liệu thất bại");
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
              <UomPicker
                value={form.unit}
                onChange={(code) => setForm((f) => ({ ...f, unit: code }))}
              />
            </Field>
            <Field label="Loại nguyên liệu">
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  {(catList?.data || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngưỡng cảnh báo">
              <Input
                type="text"
                inputMode="decimal"
                value={form.alertThreshold}
                onChange={(e) => {
                  const v = e.target.value;
                  // Chỉ cho phép nhập số và 1 dấu chấm
                  if (/^\d*(\.\d*)?$/.test(v))
                    setForm((f) => ({ ...f, alertThreshold: v }));
                }}
                placeholder="Để trống = 0"
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
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Ghi chú chất lượng, lô nhập, ..."
              maxLength={255}
            />
            <div className="text-xs text-right text-muted-foreground">
              {form.description.length}/255
            </div>
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
