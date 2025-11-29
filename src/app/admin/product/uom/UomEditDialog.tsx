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
  useUomUsageQuery,
} from "@/hooks/admin/useUnitsOfMeasure";
import {
  useUomConversionsQuery,
  useCreateUomConversionMutation,
  useUpdateUomConversionMutation,
} from "@/hooks/admin/useUomConversions";
import type { UnitOfMeasure } from "@/types/admin/product/uom";
import { useAppToast } from "@/lib/toast";
import { Pencil, Save, Loader2, LockKeyhole } from "lucide-react";

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

  // Form State
  const [name, setName] = useState(uom.name);
  const [dimension] = useState<UnitOfMeasure["dimension"]>(uom.dimension);
  const [convFactor, setConvFactor] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const effectiveBaseCode = uom.baseCode ?? uom.code;
  const isBase = effectiveBaseCode === uom.code;

  // 1. Fetch dữ liệu Conversion
  const convQuery = useUomConversionsQuery(
    { fromCode: uom.code, toCode: effectiveBaseCode, limit: 1 },
    { enabled: open && !isBase }
  );

  // 2. Fetch dữ liệu Usage
  const usageQuery = useUomUsageQuery(uom.code, {
    enabled: open && !isBase,
  });

  // --- SỬA LOGIC CHECK TẠI ĐÂY ---
  const isLoadingUsage = usageQuery.isLoading;

  // Lấy ra object counts từ API
  const counts = usageQuery.data?.counts;

  // Chỉ tính là "Đã sử dụng" nếu 1 trong 4 bảng nghiệp vụ có dữ liệu
  // Bỏ qua trường 'conversions' vì nó luôn tồn tại khi sửa quy đổi
  const hasTransactionData =
    (counts?.inventoryItems ?? 0) > 0 ||
    (counts?.purchaseReceiptItems ?? 0) > 0 ||
    (counts?.purchaseReturnLogs ?? 0) > 0 ||
    (counts?.ingredients ?? 0) > 0;

  // Nếu có dữ liệu nghiệp vụ -> KHÔNG cho sửa (canEdit = false)
  const canEditFactor = !hasTransactionData;

  // --- Reset Form khi mở Dialog ---
  useEffect(() => {
    if (open) {
      setName(uom.name);
      setErrors({});
      if (!isBase && convQuery.data) {
        const r = (convQuery.data?.data ?? [])[0];
        if (r) setConvFactor(String(r.factor ?? ""));
      }
    }
  }, [open, uom.name, isBase, convQuery.data]);

  // --- Xử lý Submit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tên không được để trống");
      return;
    }
    setSubmitting(true);

    const doAfter = () => {
      toast.success("Đã cập nhật đơn vị tính");
      setOpen(false);
      onUpdated?.();
      setSubmitting(false);
    };

    updateMut.mutate(
      {
        args: { code: uom.code },
        data: { name: name.trim(), dimension, baseCode: effectiveBaseCode },
      },
      {
        onSuccess: () => {
          // Nếu là Base unit hoặc Bị khóa do có giao dịch -> Chỉ update tên
          if (isBase || !canEditFactor) {
            doAfter();
            return;
          }

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
              { onSuccess: doAfter, onError: () => setSubmitting(false) }
            );
          } else {
            createConv.mutate(
              { fromCode: uom.code, toCode: effectiveBaseCode, factor: f },
              { onSuccess: doAfter, onError: () => setSubmitting(false) }
            );
          }
        },
        onError: (e) => {
          handleMutationError(e, "Cập nhật thất bại");
          setSubmitting(false);
        },
      }
    );
  };

  const updateMut = useUpdateUomMutation({});
  const createConv = useCreateUomConversionMutation({});
  const updateConv = useUpdateUomConversionMutation({});
  const activateMut = useActivateUomMutation({
    onSuccess: () => {
      toast.success("Đã kích hoạt");
      onUpdated?.();
    },
  });
  const deactivateMut = useDeactivateUomMutation({
    onSuccess: () => {
      toast.success("Đã ngưng hoạt động");
      onUpdated?.();
    },
  });

  const handleMutationError = (e: any, defaultMsg: string) => {
    toast.error(defaultMsg, e?.message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Chỉnh sửa">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đơn vị</DialogTitle>
          <DialogDescription>
            Mã đơn vị {uom.code} không thể thay đổi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Mã</Label>
            <Input value={uom.code} disabled readOnly className="bg-muted" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Trạng thái:</Label>
              {uom.isActive === false ? (
                <Badge variant="destructive">Ngưng hoạt động</Badge>
              ) : (
                <Badge variant="outline">Hoạt động</Badge>
              )}
            </div>
            {uom.isActive === false ? (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => activateMut.mutate({ code: uom.code })}
              >
                Kích hoạt
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                type="button"
                onClick={() => {
                  if (confirm("Ngưng hoạt động?"))
                    deactivateMut.mutate({ code: uom.code });
                }}
              >
                Ngưng hoạt động
              </Button>
            )}
          </div>

          <div>
            <Label>Tên hiển thị</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="rounded-md border p-3 bg-slate-50 space-y-2">
            <Label className="text-sm font-medium">Loại đơn vị</Label>
            {isBase ? (
              <p className="text-sm text-muted-foreground">
                Đơn vị cơ sở (Base).
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Đơn vị quy đổi (Pack / Case).
                </p>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Đơn vị cơ sở</Label>
                      <Input
                        value={effectiveBaseCode}
                        disabled
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex justify-between items-center">
                        Hệ số
                        {!canEditFactor && !isLoadingUsage && (
                          <span className="text-[10px] text-red-600 font-bold flex items-center ml-1">
                            <LockKeyhole className="h-3 w-3 mr-0.5" /> (Đã khóa)
                          </span>
                        )}
                      </Label>

                      {isLoadingUsage ? (
                        <div className="h-9 w-full bg-slate-200 animate-pulse rounded border" />
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          step={0.0001}
                          value={convFactor}
                          onChange={(e) => setConvFactor(e.target.value)}
                          disabled={!canEditFactor}
                          className={
                            !canEditFactor
                              ? "bg-red-50 text-red-900 border-red-200 cursor-not-allowed font-medium"
                              : "bg-white"
                          }
                        />
                      )}
                    </div>
                  </div>

                  {!canEditFactor && !isLoadingUsage && (
                    <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100 flex gap-2 items-start">
                      <LockKeyhole className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div>
                        Đơn vị này đã được sử dụng trong nghiệp vụ (Kho:{" "}
                        {counts?.inventoryItems}, Nhập:{" "}
                        {counts?.purchaseReceiptItems}, Công thức:{" "}
                        {counts?.ingredients}). Bạn không thể thay đổi hệ số quy
                        đổi.
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground text-center">
                    1 {uom.code} = <b>{convFactor || "..."}</b>{" "}
                    {effectiveBaseCode}
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
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting || isLoadingUsage}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
