"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import mapServerError from "@/lib/mapServerError";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Edit3 } from "lucide-react";

import { useUpdateCategoryMutation } from "@/hooks/admin/useCategory";
import type { CreateCategoryPayload } from "@/types/admin/product/category";

export default function EditCategoryDialog({
  category,
  onUpdated,
}: {
  category: any;
  onUpdated?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);

  // use shared mapServerError helper

  type FormValues = Partial<CreateCategoryPayload> & {
    name: string;
    isActive?: boolean;
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: category.name ?? "",
      description: category.description ?? "",
      type: category.type ?? "MENU",
      isActive: category.isActive ?? true,
    },
    mode: "onTouched",
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: category.name ?? "",
        description: category.description ?? "",
        type: category.type ?? "MENU",
        isActive: category.isActive ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  const { mutate, isPending, error } = useUpdateCategoryMutation();

  const onSubmit = handleSubmit((values) => {
    mutate(
      { args: { id: category.id }, data: values },
      {
        onSuccess: () => {
          setOpen(false);
          qc.invalidateQueries({ queryKey: ["categories"] });
          onUpdated?.();
          toast({ title: "Cập nhật thành công" });
        },
        // --- SỬA ĐOẠN NÀY ---
        onError: (err: any) => {
          const { message } = mapServerError(err);
          // show only Vietnamese message, emphasized with colored box
          setServerError(message);
          const box = (
            <div className="rounded-md bg-red-50 border border-red-100 p-2">
              <div className="text-sm font-medium text-red-800">{message}</div>
            </div>
          );
          toast({ title: "Không thể cập nhật", description: box });
        },
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="px-2 py-1">
          <Edit3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div>
            <Label>Tên *</Label>
            <Input
              placeholder="Hải sản"
              {...register("name", {
                required: "Vui lòng nhập tên danh mục",
                minLength: { value: 2, message: "Tên quá ngắn" },
              })}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea
              placeholder="Nhóm các món hải sản"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Loại *</Label>
              <Controller
                control={control}
                name="type"
                rules={{ required: "Vui lòng chọn loại" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"MENU"}>MENU</SelectItem>
                      <SelectItem value={"INGREDIENT"}>INGREDIENT</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.type.message as string}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div>
                <Label>Hiển thị</Label>
                <div className="mt-2">
                  <Controller
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={(v) => field.onChange(v)}
                        />
                        <span className="text-sm text-slate-700">
                          {field.value ? "Đang dùng" : "Ẩn"}
                        </span>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {serverError && <p className="text-sm text-red-500">{serverError}</p>}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
