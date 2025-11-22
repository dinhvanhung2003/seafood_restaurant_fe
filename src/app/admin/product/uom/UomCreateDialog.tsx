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
  { value: "length", label: "Chiều dài (length)" },
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

  // chỉ dùng khi CẦN quy đổi (tức là đã có base UOM)
  const [convBaseCode, setConvBaseCode] = useState<string>(""); // mã base uom được chọn
  const [convFactor, setConvFactor] = useState<string>(""); // hệ số
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Lấy toàn bộ UOM (chỉ active) để lọc theo dimension
  const { data: listData } = useUomsQuery({
    page: 1,
    limit: 200,
    isActive: true,
  });

  // Tất cả UOM cùng dimension
  const sameDimensionUoms: UnitOfMeasure[] = useMemo(() => {
    const want = String(form.dimension || "").toLowerCase();
    return (listData?.data || []).filter(
      (u) => String(u.dimension || "").toLowerCase() === want
    );
  }, [listData, form.dimension]);

  // Có ít nhất 1 base UOM trong dimension này chưa?
  const hasBaseInDimension = sameDimensionUoms.length > 0;

  const createUomMut = useCreateUomMutation({
    onError: (e: any) => {
      // try to parse validation messages
      const msg = e?.response?.data?.message;
      if (Array.isArray(msg)) {
        const parsed = parseServerErrors(msg as string[]);
        setErrors(parsed);
        if (parsed._ && parsed._?.length) {
          toast.error(parsed._?.join("; "));
          return;
        }
      }
      toast.error("Tạo đơn vị thất bại", (e as Error)?.message);
    },
  });
  const createConvMut = useCreateUomConversionMutation({
    onError: (e) => toast.error("Tạo quy đổi thất bại", (e as Error)?.message),
  });

  const reset = () => {
    setForm({ code: "", name: "", dimension: "count" });
    setConvBaseCode("");
    setConvFactor("");
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) reset();
  };

  // Khi đổi dimension thì reset thông tin quy đổi
  useEffect(() => {
    setConvBaseCode("");
    setConvFactor("");
  }, [form.dimension]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    if (!code || !name) {
      toast.error("Vui lòng nhập mã và tên");
      return;
    }

    setSubmitting(true);

    // 1) Nếu CHƯA có base UOM trong dimension này => đây là đơn vị cơ sở đầu tiên
    if (!hasBaseInDimension) {
      const payload: CreateUomPayload = {
        ...form,
        code,
        name,
        baseCode: code, // tự nó là base
      };

      createUomMut.mutate(payload, {
        onSuccess: () => {
          setErrors({});
          toast.success("Đã tạo đơn vị cơ sở");
          setSubmitting(false);
          setOpen(false);
          reset();
          onCreated?.();
        },
        onSettled: () => {
          if (!createUomMut.isSuccess) setSubmitting(false);
        },
      });
      return;
    }

    // 2) Đã có base UOM => đơn vị mới là đơn vị quy đổi, BẮT BUỘC phải chọn base + factor
    const factorNum = Number(convFactor);
    if (!convBaseCode) {
      toast.error("Vui lòng chọn đơn vị cơ sở để quy đổi");
      setSubmitting(false);
      return;
    }
    if (!isFinite(factorNum) || factorNum <= 0) {
      toast.error("Hệ số quy đổi không hợp lệ");
      setSubmitting(false);
      return;
    }

    const payload: CreateUomPayload = {
      ...form,
      code,
      name,
      baseCode: convBaseCode, // baseCode = UOM cơ sở đã chọn
    };

    createUomMut.mutate(payload, {
      onSuccess: () => {
        setErrors({});
        // Thêm dòng conversion: 1 NEW = factor × BASE
        createConvMut.mutate(
          {
            fromCode: code,
            toCode: convBaseCode,
            factor: factorNum,
          },
          {
            onSuccess: () =>
              toast.success("Đã tạo đơn vị & quy đổi thành công"),
            onSettled: () => {
              setSubmitting(false);
              setOpen(false);
              reset();
              onCreated?.();
            },
          }
        );
      },
      onSettled: () => {
        if (!createUomMut.isSuccess) setSubmitting(false);
      },
    });
  };

  const canSubmit = (() => {
    const code = form.code.trim();
    const name = form.name.trim();
    if (!code || !name || submitting) return false;

    if (!hasBaseInDimension) {
      // tạo base đầu tiên: chỉ cần code + name
      return true;
    }

    const factorNum = Number(convFactor);
    return (
      !!convBaseCode && isFinite(factorNum) && factorNum > 0 && !submitting
    );
  })();

  function clearFieldErr(field: string) {
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  }

  function parseServerErrors(arr: string[]) {
    const result: Record<string, string[]> = {};
    try {
      for (const s of arr) {
        const lower = (s || "").toLowerCase();
        if (lower.includes("name")) {
          result.name = result.name || [];
          result.name.push(s);
        } else if (lower.includes("dimension")) {
          result.dimension = result.dimension || [];
          result.dimension.push(s);
        } else if (
          lower.includes("basecode") ||
          lower.includes("base code") ||
          lower.includes("base_code")
        ) {
          result.baseCode = result.baseCode || [];
          result.baseCode.push(s);
        } else if (lower.includes("code")) {
          result.code = result.code || [];
          result.code.push(s);
        } else {
          // fallback to general
          result._ = result._ || [];
          result._.push(s);
        }
      }
    } catch (e) {
      // ignore
    }
    return result;
  }

  // Field-level error helpers are declared above

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" /> Thêm đơn vị tính
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Thêm đơn vị tính</DialogTitle>
          <DialogDescription>
            Dùng cho nhập kho, bán hàng và công thức. Hệ thống tự chọn đơn vị cơ
            sở theo quy cách đo (G, ML, CAN, EGG…). Nếu đã có đơn vị cơ sở thì
            đơn vị mới sẽ là đơn vị quy đổi (Thùng, Lốc, Vỉ, Hộp…).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thông tin chung */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mã</Label>
              <Input
                value={form.code}
                onChange={(e) => {
                  clearFieldErr("code");
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase(),
                  }));
                }}
                placeholder="VD: G, KG, CAN, CASE24"
                required
              />
              {errors?.code?.[0] && (
                <p className="text-xs text-destructive">{errors.code[0]}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Nên viết hoa, ngắn gọn, dễ nhớ.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Tên</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  clearFieldErr("name");
                  setForm((f) => ({ ...f, name: e.target.value }));
                }}
                placeholder="VD: Gram, Kilogram, Lon, Thùng 24 lon"
                required
              />
              {errors?.name?.[0] && (
                <p className="text-xs text-destructive">{errors.name[0]}</p>
              )}
            </div>
          </div>

          {/* Quy cách đo */}
          <div className="space-y-1.5">
            <Label>Quy cách đo</Label>
            <Select
              value={form.dimension}
              onValueChange={(v) => {
                clearFieldErr("dimension");
                setForm((f) => ({ ...f, dimension: v as any }));
              }}
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
              {errors?.dimension?.[0] && (
                <p className="text-xs text-destructive mt-1">
                  {errors.dimension[0]}
                </p>
              )}
            </Select>
          </div>

          {/* Thông báo / khối quy đổi */}
          {!hasBaseInDimension ? (
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Đây sẽ là{" "}
              <span className="font-semibold">đơn vị cơ sở đầu tiên</span> cho
              quy cách đo{" "}
              <span className="font-mono uppercase">{form.dimension}</span> (ví
              dụ: G cho khối lượng, CAN cho bia, EGG cho trứng…). Đơn vị cơ sở
              dùng để tính tồn kho.
            </div>
          ) : (
            <div className="rounded-md border p-4 space-y-3">
              <div className="space-y-0.5">
                <Label className="font-medium">
                  Quy đổi so với đơn vị cơ sở
                </Label>
                <p className="text-xs text-muted-foreground">
                  1 <span className="font-mono">{form.code || "MỚI"}</span> = hệ
                  số × đơn vị cơ sở
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={convBaseCode || undefined}
                  onValueChange={(v) => {
                    clearFieldErr("baseCode");
                    setConvBaseCode(v);
                  }}
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Chọn đơn vị cơ sở" />
                  </SelectTrigger>
                  <SelectContent>
                    {sameDimensionUoms.map((u) => (
                      <SelectItem key={u.code} value={u.code}>
                        {u.code} · {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors?.baseCode?.[0] && (
                  <p className="text-xs text-destructive">
                    {errors.baseCode[0]}
                  </p>
                )}

                <Input
                  type="number"
                  min={0}
                  step={0.001}
                  placeholder="Hệ số"
                  value={convFactor}
                  onChange={(e) => setConvFactor(e.target.value)}
                />

                <div className="col-span-3 flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Gợi ý nhanh:
                  </span>
                  {[6, 10, 12, 24, 1000].map((n) => (
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
                    {convBaseCode || "Đơn vị cơ sở"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              <Save className="h-4 w-4 mr-2" /> Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
