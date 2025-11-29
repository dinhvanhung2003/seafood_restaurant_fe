"use client";
import { useRef, useState, useEffect } from "react";
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
import { useCreateComboMutation } from "@/hooks/admin/useCombo";
import ComboComponentsBuilder, { ComboRow } from "./ComboComponentsBuilder";
import mapServerError from "@/lib/mapServerError";

type FormErrors = {
  name?: string;
  price?: string;
  components?: string;
  image?: string;
  root?: string;
};

export default function ComboCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const create = useCreateComboMutation();
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | string>(0);
  const [desc, setDesc] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [rows, setRows] = useState<ComboRow[]>([
    { itemId: undefined, quantity: 1 },
  ]);
  const [errors, setErrors] = useState<FormErrors>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setErrors({});
    }
  }, [open]);

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

    if (!fileRef.current?.files?.[0]) {
      newErrors.image = "Vui lòng chọn ảnh đại diện cho combo.";
      isValid = false;
    }

    const ids = rows.map((r) => r.itemId).filter(Boolean) as string[];

    if (ids.length === 0) {
      newErrors.components = "Vui lòng chọn ít nhất 1 món thành phần.";
      isValid = false;
    } else if (ids.length !== new Set(ids).size) {
      newErrors.components = "Danh sách thành phần đang có món bị trùng lặp.";
      isValid = false;
    } else if (rows.some((r) => !r.itemId || !r.quantity || r.quantity <= 0)) {
      newErrors.components =
        "Vui lòng chọn món và nhập số lượng hợp lệ cho tất cả các dòng.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreate = () => {
    if (!validate()) return;
    const file = fileRef.current!.files![0];
    const components = rows.map((r) => ({
      itemId: r.itemId!,
      quantity: Number(r.quantity),
    }));

    create.mutate(
      {
        name: name.trim(),
        comboPrice: Number(price),
        description: desc,
        isAvailable,
        components,
        image: file,
      },
      {
        onSuccess: () => {
          onCreated?.();
          onOpenChange(false);
          setName("");
          setPrice(0);
          setRows([{ itemId: undefined, quantity: 1 }]);
        },
        onError: (error) => {
          const { code, message } = mapServerError(error);
          if (
            code === "COMBO_NAME_DUPLICATED" ||
            code === "COMBO_NAME_REQUIRED"
          ) {
            setErrors((prev) => ({ ...prev, name: message }));
          } else {
            setErrors((prev) => ({ ...prev, root: message }));
          }
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
          <DialogTitle>Tạo combo mới</DialogTitle>
        </DialogHeader>

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
              placeholder="VD: Combo Lẩu Nướng 2 người"
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
              Giá combo (VNĐ) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                clearError("price");
              }}
              // --- CẬP NHẬT: Class ẩn mũi tên ---
              className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                errors.price ? "border-red-500 focus-visible:ring-red-500" : ""
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
              placeholder="Mô tả chi tiết về combo..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            <span className="font-medium text-sm">Đang bán (Sẵn sàng)</span>
          </div>

          <div className="border-t pt-4"></div>

          <div>
            <Label className="mb-2 block">
              Thành phần combo <span className="text-red-500">*</span>
            </Label>
            <div
              className={`rounded-md ${
                errors.components ? "border border-red-200 bg-red-50 p-2" : ""
              }`}
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
            <Label className="mb-1.5 block">
              Ảnh đại diện <span className="text-red-500">*</span>
            </Label>
            <Input
              type="file"
              ref={fileRef}
              accept="image/*"
              onChange={() => clearError("image")}
              className={errors.image ? "border-red-500 file:text-red-500" : ""}
            />
            {errors.image && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.image}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Huỷ bỏ
          </Button>
          <Button onClick={handleCreate} disabled={create.isPending}>
            {create.isPending ? "Đang xử lý..." : "Tạo Combo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
