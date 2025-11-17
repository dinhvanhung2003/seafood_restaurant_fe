"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateUomMutation,
  useUomsQuery,
} from "@/hooks/admin/useUnitsOfMeasure";
import { useCreateUomConversionMutation } from "@/hooks/admin/useUomConversions";
import type {
  CreateUomPayload,
  UnitOfMeasure,
} from "@/types/admin/product/uom";
import { useAppToast } from "@/lib/toast";
import { PlusCircle, Save } from "lucide-react";

const DIMENSIONS = [
  { value: "count", label: "Số lượng (count)" },
  { value: "mass", label: "Khối lượng (mass)" },
  { value: "volume", label: "Thể tích (volume)" },
] as const;

type Props = { onCreated?: () => void };

export function UomCreateDialog({ onCreated }: Props) {
  const toast = useAppToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateUomPayload>({
    code: "",
    name: "",
    dimension: "count",
  });
  // dùng 'none' làm sentinel thay cho chuỗi rỗng để tránh lỗi SelectItem yêu cầu non-empty value
  const [convTarget, setConvTarget] = useState<string>("none");
  const [convFactor, setConvFactor] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Lấy danh sách UOM để chọn mục chuyển đổi
  const { data: listData } = useUomsQuery({ page: 1, limit: 100 });

  const sameDimensionUoms: UnitOfMeasure[] = useMemo(() => {
    const want = String(form.dimension || "").toLowerCase();
    return (listData?.data || []).filter(
      (u) => String(u.dimension || "").toLowerCase() === want
    );
  }, [listData, form.dimension]);

  const createUomMut = useCreateUomMutation({
    onError: (e) => toast.error("Tạo đơn vị thất bại", (e as Error)?.message),
  });
  const createConvMut = useCreateUomConversionMutation({
    onError: (e) => toast.error("Tạo quy đổi thất bại", (e as Error)?.message),
  });

  const reset = () => {
    setForm({ code: "", name: "", dimension: "count" });
    setConvTarget("none");
    setConvFactor("");
  };

  // Tự động chọn đơn vị đích đầu tiên cùng quy cách khi có
  useEffect(() => {
    if (convTarget === "none" && (sameDimensionUoms?.length || 0) > 0) {
      setConvTarget(sameDimensionUoms[0].code);
    }
  }, [sameDimensionUoms, convTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Vui lòng nhập mã và tên");
      return;
    }
    setSubmitting(true);
    createUomMut.mutate(form, {
      onSuccess: () => {
        // Nếu người dùng khai báo quy đổi
        if (convTarget !== "none" && convFactor) {
          const factorNum = Number(convFactor);
          if (!isFinite(factorNum) || factorNum <= 0) {
            toast.error("Hệ số quy đổi không hợp lệ");
          } else {
            createConvMut.mutate(
              {
                fromCode: form.code.toUpperCase(),
                toCode: convTarget,
                factor: factorNum,
              },
              {
                onSuccess: () => toast.success("Đã tạo đơn vị & quy đổi"),
                onSettled: () => {
                  setSubmitting(false);
                  setOpen(false);
                  reset();
                  onCreated?.();
                },
              }
            );
            return; // chờ mutation quy đổi
          }
        }
        toast.success("Đã tạo đơn vị tính");
        setSubmitting(false);
        setOpen(false);
        reset();
        onCreated?.();
      },
      onSettled: () => {
        if (!createUomMut.isSuccess) setSubmitting(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" /> Thêm đơn vị tính
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Thêm đơn vị tính</DialogTitle>
          <DialogDescription>
            Tạo mã đo lường dùng cho hàng hoá và công thức. Bạn có thể khai báo
            quy đổi để hệ thống tự tính khi chuyển đơn vị.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mã</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="VD: G, KG, PACK"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Nên viết hoa, ngắn gọn, dễ nhớ.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Tên</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="VD: Gram, Kilogram, Bịch 500g"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Quy cách đo</Label>
            <Select
              value={form.dimension}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, dimension: v as any }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn quy cách" />
              </SelectTrigger>
              <SelectContent>
                {DIMENSIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border p-4 space-y-3">
            <div className="space-y-0.5">
              <Label className="font-medium">Quy đổi (bắt buộc)</Label>
              <p className="text-xs text-muted-foreground">
                1 <span className="font-mono">{form.code || "MỚI"}</span> = hệ
                số × đơn vị đích
              </p>
            </div>

            {sameDimensionUoms.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={
                    (convTarget !== "none" ? convTarget : undefined) as any
                  }
                  onValueChange={(v) => setConvTarget(v)}
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Chọn đơn vị đích" />
                  </SelectTrigger>
                  <SelectContent>
                    {sameDimensionUoms.map((u) => (
                      <SelectItem key={u.code} value={u.code}>
                        {u.code} · {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  step={0.001}
                  placeholder="Hệ số"
                  value={convFactor}
                  onChange={(e) => setConvFactor(e.target.value)}
                  disabled={convTarget === "none"}
                />
                <div className="col-span-3 flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Gợi ý nhanh:
                  </span>
                  {[12, 24, 1000].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setConvFactor(String(n))}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
                <div className="col-span-3 text-xs text-muted-foreground">
                  1 <span className="font-mono">{form.code || "MỚI"}</span> ={" "}
                  {convFactor || "…"} ×{" "}
                  <span className="font-mono">
                    {convTarget !== "none" ? convTarget : "…"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-600">
                Chưa có đơn vị cùng quy cách để quy đổi. Vui lòng tạo trước một
                đơn vị chuẩn (ví dụ: EA, G, ML).
              </p>
            )}
          </div>

          {(() => {
            const canSubmit =
              sameDimensionUoms.length > 0 &&
              convTarget !== "none" &&
              isFinite(Number(convFactor)) &&
              Number(convFactor) > 0;
            return (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting || !canSubmit}>
                  <Save className="h-4 w-4 mr-2" /> Lưu
                </Button>
              </DialogFooter>
            );
          })()}
        </form>
      </DialogContent>
    </Dialog>
  );
}
