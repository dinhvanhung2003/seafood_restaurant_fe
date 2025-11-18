"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useStockInIngredient } from "@/hooks/admin/useIngredients";
import { useCategoriesQuery } from "@/hooks/admin/useCategory";
import { useUomsQuery } from "@/hooks/admin/useUnitsOfMeasure";
import { UomPicker } from "@/components/admin/inventories/inventory-item/modal/UomPicker";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const REDIRECT_TO = "/admin/inventories/purchase/new";

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

export default function IngredientCreatePage() {
  const router = useRouter();
  const stockIn = useStockInIngredient();

  const { data: uomList } = useUomsQuery({
    page: 1,
    limit: 10,
    sortBy: "code",
    sortDir: "ASC",
  });

  const qActive = useCategoriesQuery({
    type: "INGREDIENT",
    page: 1,
    limit: 10,
  });
  const wantIngAll =
    qActive.data !== undefined && (qActive.data?.data?.length ?? 0) === 0;
  const qIngAll = useCategoriesQuery(
    { type: "INGREDIENT", page: 1, limit: 10 },
    { enabled: wantIngAll }
  );
  const wantAny =
    qIngAll.data !== undefined && (qIngAll.data?.data?.length ?? 0) === 0;
  const qAny = useCategoriesQuery({ page: 1, limit: 10 }, { enabled: wantAny });
  const categories =
    (qActive.data?.data?.length ?? 0) > 0
      ? qActive.data!.data
      : (qIngAll.data?.data?.length ?? 0) > 0
      ? qIngAll.data!.data
      : qAny.data?.data ?? [];
  const usingAny =
    (qActive.data?.data?.length ?? 0) === 0 &&
    (qIngAll.data?.data?.length ?? 0) === 0 &&
    (qAny.data?.data?.length ?? 0) > 0;

  const [form, setForm] = React.useState({
    name: "",
    unit: "",
    alertThreshold: "0",
    description: "",
    categoryId: undefined as string | undefined,
  });

  React.useEffect(() => {
    if (!form.unit && (uomList?.data?.length ?? 0) > 0)
      setForm((f) => ({ ...f, unit: uomList!.data[0].code }));
  }, [uomList, form.unit]);

  const submit = async () => {
    if (!form.name.trim())
      return toast.error("Tên nguyên liệu không được trống");
    if (!form.unit.trim()) return toast.error("Đơn vị không được trống");
    const alertNum = parseFloat(form.alertThreshold);
    if (Number.isNaN(alertNum) || alertNum < 0)
      return toast.error("Ngưỡng cảnh báo không hợp lệ");

    try {
      const res = await stockIn.mutateAsync({
        name: form.name.trim(),
        unit: form.unit.trim(),
        alertThreshold: alertNum,
        description: form.description?.trim() || undefined,
        categoryId: form.categoryId,
      });
      const data = (res as any)?.data ?? res;
      toast.success("Đã tạo nguyên liệu mới", { description: data?.name });
      router.push(REDIRECT_TO);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Tạo nguyên liệu thất bại"
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Thêm nguyên liệu mới
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tạo nguyên liệu để sử dụng trong nhập kho, định lượng món, và cảnh báo
          tồn.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Thông tin nguyên liệu</CardTitle>
          <CardDescription>
            Nhập các thông tin cơ bản. Có thể chỉnh sửa sau.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field label="Tên">
            <Input
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Ví dụ: Tôm hùm"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Đơn vị">
              <UomPicker
                value={form.unit}
                onChange={(code) => setForm((f) => ({ ...f, unit: code }))}
              />
            </Field>
            <Field label="Loại nguyên liệu">
              <Select
                value={form.categoryId}
                onValueChange={(v: string) =>
                  setForm((f) => ({ ...f, categoryId: v }))
                }
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
              {usingAny && (
                <div className="mt-1 text-[12px] text-muted-foreground">
                  Hiển thị tất cả danh mục vì chưa có loại INGREDIENT.
                </div>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ngưỡng cảnh báo">
              <Input
                type="text"
                inputMode="decimal"
                value={form.alertThreshold}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const v = e.target.value;
                  if (/^\d*(\.\d*)?$/.test(v) || v === "")
                    setForm((f) => ({ ...f, alertThreshold: v }));
                }}
                placeholder="VD: 5, 10, 0.5"
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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Ghi chú chất lượng, lô nhập, ..."
            />
          </Field>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t bg-slate-50/40">
          <Button variant="outline" onClick={() => router.push(REDIRECT_TO)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={stockIn.isPending}>
            {stockIn.isPending ? "Đang lưu..." : "Lưu nguyên liệu"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
