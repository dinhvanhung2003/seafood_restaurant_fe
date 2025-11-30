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
import { useUpdateIngredient } from "@/hooks/admin/useIngredients";
import { toast } from "sonner";
import { useCategoriesQuery } from "@/hooks/admin/useCategory";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

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

export type EditIngredientModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  id: string;
  defaults: {
    name: string;
    alertThreshold: number;
    description?: string | null;
    categoryId?: string | null;
  };
  onSaved?: () => void;
  categoriesProp?: Array<{ id: string; name: string; type?: string }>;
};

export default function EditIngredientModal({
  open,
  onOpenChange,
  id,
  defaults,
  onSaved,
}: EditIngredientModalProps) {
  const updateMut = useUpdateIngredient();
  const qCat = useCategoriesQuery({ type: "INGREDIENT", page: 1, limit: 10 });
  const categories = qCat.data?.data ?? [];

  const [form, setForm] = React.useState({
    name: defaults.name ?? "",
    alertThreshold: String(defaults.alertThreshold ?? 0),
    description: defaults.description ?? "",
    categoryId: (defaults.categoryId as string | undefined) ?? undefined,
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        name: defaults.name ?? "",
        alertThreshold: String(defaults.alertThreshold ?? 0),
        description: defaults.description ?? "",
        categoryId: (defaults.categoryId as string | undefined) ?? undefined,
      });
    }
  }, [open, defaults]);

  const submit = async () => {
    // 1. Validate Tên
    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) {
      return toast.error("Tên nguyên liệu không được để trống");
    }
    if (!/^[\p{L}\p{N}\s]+$/u.test(nameTrimmed)) {
      return toast.error(
        "Tên chỉ được chứa chữ cái và số, không chứa ký tự đặc biệt"
      );
    }

    // 2. Validate Loại (Unit thường không sửa trong edit, nếu có thì thêm validate tương tự)
    if (!form.categoryId) {
      return toast.error("Vui lòng chọn loại nguyên liệu");
    }

    // 3. Validate Ngưỡng cảnh báo
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

    // 5. Validate Mô tả
    if (form.description && form.description.length > 255) {
      return toast.error("Mô tả không được vượt quá 255 ký tự");
    }

    try {
      const payload = {
        name: nameTrimmed,
        alertThreshold: alertNum,
        description: form.description?.trim() || null,
        categoryId: form.categoryId ?? null,
      };

      const res = await updateMut.mutateAsync({ args: { id }, data: payload });
      toast.success("Đã cập nhật nguyên liệu");
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Cập nhật thất bại";
      toast.error(String(msg));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cập Nhật Hàng Hóa</DialogTitle>
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
            <Field label="Loại nguyên liệu">
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      categories.length === 0
                        ? "Không có loại phù hợp"
                        : "Chọn loại"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Chưa có danh mục để chọn
                    </SelectItem>
                  ) : (
                    categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Ngưỡng cảnh báo">
              <Input
                type="text"
                inputMode="decimal"
                value={form.alertThreshold}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*(\.\d*)?$/.test(v))
                    setForm((f) => ({ ...f, alertThreshold: v }));
                }}
                placeholder="Để trống = 0"
              />
            </Field>
          </div>

          <Field label="Mô tả">
            <Textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Ghi chú chất lượng, lô nhập, ..."
              maxLength={255}
            />
            <div className="text-xs text-right text-muted-foreground">
              {(form.description || "").length}/255
            </div>
          </Field>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={updateMut.status === "pending"}>
            {updateMut.status === "pending" ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
