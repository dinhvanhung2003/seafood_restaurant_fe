"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  useUpdateUomMutation,
  useActivateUomMutation,
  useDeactivateUomMutation,
} from "@/hooks/admin/useUnitsOfMeasure";
import {
  useUomConversionsQuery,
  useCreateUomConversionMutation,
  useUpdateUomConversionMutation,
} from "@/hooks/admin/useUomConversions";
import type { UnitOfMeasure } from "@/types/admin/product/uom";
import { useAppToast } from "@/lib/toast";
import { Pencil, Save } from "lucide-react";

const DIMENSIONS = [
  { value: "count", label: "Số lượng (count)" },
  { value: "mass", label: "Khối lượng (mass)" },
  { value: "volume", label: "Thể tích (volume)" },
  { value: "length", label: "Chiều dài (length)" },
] as const;

type Props = { uom: UnitOfMeasure; onUpdated?: () => void };

export function UomEditDialog({ uom, onUpdated }: Props) {
  const toast = useAppToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(uom.name);
  const [dimension] = useState<UnitOfMeasure["dimension"]>(uom.dimension); // luôn giữ nguyên
  const [convFactor, setConvFactor] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function clearFieldErr(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function parseServerErrors(arr: string[]) {
    const result: Record<string, string[]> = {};
    try {
      for (const s of arr) {
        const lower = (s || "").toLowerCase();
        if (lower.includes("name")) {
          (result.name ??= []).push(s);
        } else if (lower.includes("dimension")) {
          (result.dimension ??= []).push(s);
        } else if (
          lower.includes("basecode") ||
          lower.includes("base code") ||
          lower.includes("base_code")
        ) {
          (result.baseCode ??= []).push(s);
        } else if (lower.includes("code")) {
          (result.code ??= []).push(s);
        } else if (
          lower.includes("factor") ||
          lower.includes("hệ số") ||
          lower.includes("ratio")
        ) {
          (result.factor ??= []).push(s);
        } else {
          (result._ ??= []).push(s);
        }
      }
    } catch {
      // ignore
    }
    return result;
  }

  const updateMut = useUpdateUomMutation({
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      if (Array.isArray(msg)) {
        const parsed = parseServerErrors(msg as string[]);
        setErrors(parsed);
        if (parsed._ && parsed._.length) {
          toast.error(parsed._.join("; "));
          return;
        }
      }
      toast.error("Cập nhật thất bại", (e as Error)?.message);
    },
  });

  // Nếu baseCode null thì coi chính nó là đơn vị cơ sở
  const effectiveBaseCode = uom.baseCode ?? uom.code;
  const isBase = effectiveBaseCode === uom.code;

  // query conversion (if any) for this UOM -> base UOM
  const convQuery = useUomConversionsQuery(
    { fromCode: uom.code, toCode: effectiveBaseCode, limit: 1 },
    { enabled: !isBase }
  );
  const createConv = useCreateUomConversionMutation({
    onError: (e: any) => toast.error("Tạo quy đổi thất bại", e?.message),
  });
  const updateConv = useUpdateUomConversionMutation({
    onError: (e: any) => toast.error("Cập nhật quy đổi thất bại", e?.message),
  });

  const activateMut = useActivateUomMutation({
    onSuccess: () => {
      toast.success("Đã kích hoạt lại đơn vị");
      onUpdated?.();
    },
    onError: (e: any) => toast.error("Kích hoạt thất bại", e?.message),
  });

  const deactivateMut = useDeactivateUomMutation({
    onSuccess: () => {
      toast.success("Đã ngưng hoạt động đơn vị");
      onUpdated?.();
    },
    onError: (e: any) => toast.error("Ngưng hoạt động thất bại", e?.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    setSubmitting(true);

    // Gửi kèm baseCode để BE không báo lỗi
    updateMut.mutate(
      {
        args: { code: uom.code },
        data: {
          name: name.trim(),
          // dimension không cho đổi, dùng lại giá trị cũ
          dimension,
          baseCode: effectiveBaseCode,
        },
      },
      {
        onSuccess: () => {
          setErrors({});
          // If this is a conversion unit, attempt update/create conversion record
          const doAfter = () => {
            toast.success("Đã cập nhật đơn vị tính");
            setOpen(false);
            onUpdated?.();
          };

          if (!isBase) {
            const f = Number(convFactor);
            if (!isFinite(f) || f <= 0) {
              toast.error("Hệ số quy đổi không hợp lệ");
              setSubmitting(false);
              return;
            }

            const exists = (convQuery.data?.data ?? []).length > 0;
            if (exists) {
              updateConv.mutate(
                {
                  args: undefined,
                  data: {
                    fromCode: uom.code,
                    toCode: effectiveBaseCode,
                    factor: f,
                  },
                },
                { onSuccess: doAfter, onSettled: () => setSubmitting(false) }
              );
              return;
            }
            // else create
            createConv.mutate(
              { fromCode: uom.code, toCode: effectiveBaseCode, factor: f },
              { onSuccess: doAfter, onSettled: () => setSubmitting(false) }
            );
            return;
          }

          doAfter();
        },
        onSettled: () => setSubmitting(false),
      }
    );
  };

  // hydrate convFactor when conversion query returns
  useEffect(() => {
    if (!isBase && convQuery.data) {
      const r = (convQuery.data?.data ?? [])[0];
      if (r) setConvFactor(String(r.factor ?? ""));
    }
  }, [convQuery.data, isBase]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          // reset mỗi lần mở
          setName(uom.name);
          setErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Chỉnh sửa">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đơn vị</DialogTitle>
          <DialogDescription>
            Mã đơn vị <span className="font-mono">{uom.code}</span> không thể
            thay đổi. Bạn chỉ có thể cập nhật <strong>tên hiển thị</strong>, các
            thông tin khác mang tính tham khảo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mã */}
          <div>
            <Label>Mã</Label>
            <Input value={uom.code} disabled readOnly />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Trạng thái:</span>
            {uom.isActive === false ? (
              <Badge variant="destructive">Ngưng hoạt động</Badge>
            ) : (
              <Badge variant="outline">Hoạt động</Badge>
            )}
            {/* action button to toggle active state (activate when inactive, deactivate when active) */}
            {uom.isActive === false ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (!confirm(`Kích hoạt đơn vị ${uom.name} (${uom.code})?`))
                    return;
                  activateMut.mutate({ code: uom.code });
                }}
                disabled={activateMut.isPending}
              >
                Kích hoạt
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (
                    !confirm(
                      `Ngưng hoạt động đơn vị ${uom.name} (${uom.code})?`
                    )
                  )
                    return;
                  deactivateMut.mutate({ code: uom.code });
                }}
                disabled={deactivateMut.isPending}
              >
                Ngưng hoạt động
              </Button>
            )}
          </div>
          {/* Tên */}
          <div>
            <Label>Tên</Label>
            <Input
              value={name}
              onChange={(e) => {
                clearFieldErr("name");
                setName(e.target.value);
              }}
              required
            />
            {errors?.name?.[0] && (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            )}
          </div>

          {/* Quy cách đo – hiển thị, không cho đổi */}
          <div>
            <Label>Quy cách đo</Label>
            <Select value={dimension} disabled>
              <SelectTrigger className="bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIMENSIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Quy cách đo được thiết lập khi tạo đơn vị và không thể thay đổi vì
              đã ảnh hưởng đến công thức / tồn kho.
            </p>
            {errors?.dimension?.[0] && (
              <p className="text-xs text-destructive mt-1">
                {errors.dimension[0]}
              </p>
            )}
          </div>

          {/* Loại đơn vị – chỉ hiển thị, không cho sửa */}
          <div className="rounded-md border p-3 bg-muted/40 space-y-2">
            <Label className="text-sm font-medium">Loại đơn vị</Label>

            {isBase ? (
              <p className="text-sm">
                <span className="font-semibold">Đơn vị cơ sở (Base).</span> Đây
                là đơn vị nhỏ nhất dùng để tính tồn kho (ví dụ: G, ML, CAN,
                EA...). Tất cả quy đổi sẽ quy về đơn vị này.
              </p>
            ) : (
              <>
                <p className="text-sm">
                  <span className="font-semibold">
                    Đơn vị quy đổi (Pack / Case).
                  </span>{" "}
                  Đơn vị này dùng để nhập bán theo thùng / lốc / hộp lớn.
                </p>
                <div className="space-y-1">
                  <Label className="text-xs">Đơn vị cơ sở</Label>
                  <Input
                    value={
                      uom.baseName
                        ? `${uom.baseName} (${effectiveBaseCode})`
                        : effectiveBaseCode
                    }
                    disabled
                    className="bg-muted"
                  />
                  {errors?.baseCode?.[0] && (
                    <p className="text-xs text-destructive">
                      {errors.baseCode[0]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Đơn vị cơ sở</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label className="text-xs">Hệ số</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.0001}
                        value={convFactor}
                        onChange={(e) => {
                          clearFieldErr("factor");
                          setConvFactor(e.target.value);
                        }}
                      />
                      {errors?.factor?.[0] && (
                        <p className="text-xs text-destructive">
                          {errors.factor[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              <Save className="h-4 w-4 mr-2" /> Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
