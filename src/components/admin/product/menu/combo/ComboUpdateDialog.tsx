"use client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import {
  useComboDetailQuery,
  useUpdateComboMutation,
} from "@/hooks/admin/useCombo";
import { toast } from "sonner";
import ComboComponentsBuilder, { ComboRow } from "./ComboComponentsBuilder";
import mapServerError from "@/lib/mapServerError";

type FormErrors = {
  name?: string;
  price?: string;
  components?: string;
  root?: string;
};

export default function ComboUpdateDialog({
  id,
  open,
  onOpenChange,
  onUpdated,
}: {
  id?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated?: () => void;
}) {
  const detail = useComboDetailQuery(id);
  const update = useUpdateComboMutation();

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | string>(0);
  const [desc, setDesc] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [rows, setRows] = useState<ComboRow[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) setErrors({});
  }, [open]);

  useEffect(() => {
    if (detail.data) {
      setName(detail.data.name ?? "");
      const p = Number(detail.data.price ?? 0);
      setPrice(Number.isFinite(p) ? p : 0);
      setDesc(detail.data.description ?? "");
      setIsAvailable(Boolean(detail.data.isAvailable));
      setRows(
        (detail.data.components || []).map((c: any) => ({
          itemId: c.item.id,
          quantity: Number(c.quantity) || 1,
        }))
      );
      if (detail.data.image) setImagePreview(detail.data.image);
      else setImagePreview(null);
    }
  }, [detail.data]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch (e) {}
      }
    };
  }, [imagePreview]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập tên combo.";
      isValid = false;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = "Giá combo phải lớn hơn 0.";
      isValid = false;
    }

    {
      const ids = rows.map((r) => r.itemId).filter(Boolean) as string[];
      if (ids.length === 0) {
        newErrors.components = "Vui lòng chọn ít nhất 1 món thành phần.";
        isValid = false;
      } else if (ids.length !== new Set(ids).size) {
        newErrors.components = "Danh sách thành phần có món trùng.";
        isValid = false;
      } else if (
        rows.some((r) => !r.itemId || !r.quantity || r.quantity <= 0)
      ) {
        newErrors.components = "Thiếu món hoặc số lượng không hợp lệ.";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleUpdate = () => {
    if (!id) return;
    if (!validate()) return;

    const file = fileRef.current?.files?.[0];
    const components = rows.map((r) => ({
      itemId: r.itemId!,
      quantity: Number(r.quantity),
    }));

    update.mutate(
      {
        args: { id },
        data: {
          name: name.trim(),
          comboPrice: Number(price),
          description: desc,
          isAvailable,
          components,
          image: file,
        },
      },
      {
        onSuccess: () => {
          onUpdated?.();
          onOpenChange(false);
          toast.success("Cập nhật combo thành công");
        },
        onError: (error: any) => {
          const { code, message } = mapServerError(error);
          if (code === "COMBO_IN_USE_BY_OPEN_ORDERS") {
            toast.error("Cập nhật thất bại", { description: message });
            return;
          }
          if (
            code === "COMBO_NAME_DUPLICATED" ||
            code === "COMBO_NAME_REQUIRED"
          ) {
            setErrors((prev) => ({ ...prev, name: message }));
            return;
          }
          setErrors((prev) => ({ ...prev, root: message }));
          toast.error("Cập nhật thất bại", { description: message });
        },
      }
    );
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field] || errors.root) {
      setErrors((prev) => ({ ...prev, [field]: undefined, root: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật combo</DialogTitle>
        </DialogHeader>

        {detail.isLoading || (!detail.data && !detail.error) ? (
          <div className="py-6 text-center">Đang tải…</div>
        ) : detail.error ? (
          <div className="py-6 text-center text-red-500">
            {detail.error.message ?? "Không tải được thông tin combo"}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {errors.root && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {errors.root}
              </div>
            )}

            <div>
              <Label className="mb-1.5 block">
                Tên combo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                className={
                  errors.name ? "border-red-500 focus-visible:ring-red-500" : ""
                }
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1.5 block">
                Giá combo <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={Number.isFinite(price) ? price : 0}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = v === "" ? 0 : Number(v);
                  setPrice(Number.isFinite(n) ? n : 0);
                  clearError("price");
                }}
                // --- CẬP NHẬT: Class ẩn mũi tên ---
                className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  errors.price
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.price}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1.5 block">Mô tả</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
              <span className="text-sm font-medium">Đang bán (Sẵn sàng)</span>
            </div>

            <div>
              <Label className="mb-2 block">
                Thành phần combo <span className="text-red-500">*</span>
              </Label>
              <div
                className={
                  errors.components
                    ? "border border-red-200 bg-red-50 p-2 rounded"
                    : ""
                }
              >
                <ComboComponentsBuilder
                  rows={rows}
                  onChange={(newRows) => {
                    setRows(newRows);
                    clearError("components");
                  }}
                />
              </div>
              {errors.components && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.components}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1.5 block">Ảnh (tuỳ chọn)</Label>
              <div className="flex items-start gap-3">
                <Input
                  type="file"
                  ref={fileRef}
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (imagePreview && imagePreview.startsWith("blob:")) {
                      try {
                        URL.revokeObjectURL(imagePreview);
                      } catch (e) {}
                    }
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setImagePreview(url);
                    } else if (detail.data?.image) {
                      setImagePreview(detail.data.image);
                    } else {
                      setImagePreview(null);
                    }
                  }}
                />
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-24 h-24 object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-md border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={update.isPending || detail.isLoading}
          >
            {update.isPending ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
