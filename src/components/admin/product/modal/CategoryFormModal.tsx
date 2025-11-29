"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  type: string;
  setType: Dispatch<SetStateAction<string>>;
  onSubmit: () => void;
  isLoading?: boolean;
};

type FormErrors = {
  name?: string;
  type?: string;
};

export default function CategoryFormModal({
  open,
  setOpen,
  name,
  setName,
  description,
  setDescription,
  type,
  setType,
  onSubmit,
  isLoading = false,
}: Props) {
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setErrors({});
    }
  }, [open]);

  // --- HÀM KIỂM TRA LỖI ---
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // BƯỚC QUAN TRỌNG: Cắt khoảng trắng để kiểm tra
    // Ví dụ: Nhập "   " -> trimmedName = ""
    const trimmedName = name.trim();

    // 1. Kiểm tra rỗng (bao gồm cả trường hợp chỉ nhập khoảng trắng)
    if (!trimmedName) {
      // Thông báo rõ ràng hơn: không chấp nhận chuỗi chỉ có khoảng trắng
      newErrors.name =
        "Không được nhập chỉ khoảng trắng. Vui lòng nhập chữ hoặc số.";
      isValid = false;
    }
    // 2. Kiểm tra độ dài
    else if (trimmedName.length > 50) {
      newErrors.name = "Tên danh mục không được quá 50 ký tự.";
      isValid = false;
    }

    // 3. Kiểm tra Loại
    if (!type) {
      newErrors.type = "Vui lòng chọn loại danh mục.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Validate only the name field (useful onBlur)
  const validateName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrors((prev) => ({
        ...prev,
        name: "Không được nhập chỉ khoảng trắng. Vui lòng nhập chữ hoặc số.",
      }));
      return false;
    }
    if (trimmed.length > 50) {
      setErrors((prev) => ({
        ...prev,
        name: "Tên danh mục không được quá 50 ký tự.",
      }));
      return false;
    }
    // ok
    setErrors((prev) => ({ ...prev, name: undefined }));
    return true;
  };

  const handleSubmit = () => {
    // 1. Kiểm tra lỗi trước
    if (validate()) {
      // 2. Nếu không có lỗi (Hợp lệ)
      // Cập nhật lại tên đã được cắt khoảng trắng cho sạch đẹp (VD: "  Cá  " -> "Cá")
      setName(name.trim());

      // 3. Gọi hàm submit của cha
      onSubmit();
    }
    // Nếu validate trả về false (có lỗi), code dừng tại đây, không gọi API -> Không bị lỗi 400
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[90vw] !max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Thêm danh mục</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* --- TRƯỜNG TÊN --- */}
          <div>
            <Label className="mb-1.5 block font-semibold">
              Tên <span className="!text-red-500 ml-1">*</span>
            </Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              onBlur={validateName}
              placeholder="VD: Hải sản..."
              className={
                errors.name ? "border-red-500 focus-visible:ring-red-500" : ""
              }
              disabled={isLoading}
            />
            {/* Hiển thị lỗi Tên */}
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* --- TRƯỜNG MÔ TẢ --- */}
          <div>
            <Label className="mb-1.5 block font-semibold">Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhóm các món hải sản"
              className="resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>

          {/* --- TRƯỜNG LOẠI --- */}
          <div>
            <Label className="mb-1.5 block font-semibold">
              Loại <span className="!text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(val) => {
                setType(val);
                clearError("type");
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                className={
                  errors.type ? "border-red-500 focus:ring-red-500" : ""
                }
              >
                <SelectValue placeholder="Chọn loại danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MENU">MENU</SelectItem>
                <SelectItem value="OTHER">KHÁC</SelectItem>
              </SelectContent>
            </Select>
            {/* Hiển thị lỗi Loại */}
            {errors.type && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.type}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Bỏ qua
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
