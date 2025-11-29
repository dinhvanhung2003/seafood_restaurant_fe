// components/admin/product/category/modal/CreateCategory.tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus } from "lucide-react";

import { useCreateCategoryMutation } from "@/hooks/admin/useCategory";
import mapServerError from "@/lib/mapServerError";
import { useToast } from "@/components/ui/use-toast";
import type { CreateCategoryPayload } from "@/types/admin/product/category";

const TYPE_OPTIONS: CreateCategoryPayload["type"][] = ["MENU", "INGREDIENT"];

export default function CreateCategoryDialog({
  triggerLabel = "Thêm danh mục",
  defaultType = "MENU",
  onCreated,
}: {
  triggerLabel?: string;
  defaultType?: CreateCategoryPayload["type"];
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  type FormValues = CreateCategoryPayload;

  const {
    register,
    control,
    handleSubmit,

    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", description: "", type: defaultType },
    mode: "onTouched",
  });

  const { mutate, isPending, error } = useCreateCategoryMutation();
  const { toast } = useToast();

  const onSubmit = handleSubmit((values) =>
    mutate(values, {
      onSuccess: () => {
        setOpen(false);
        reset();
        // Invalidate toàn bộ list categories
        queryClient.invalidateQueries({
          queryKey: ["categories"],
          exact: false,
        });
        onCreated?.();
        toast({ title: "Tạo danh mục thành công" });
      },
      onError: (err: any) => {
        const mapped = mapServerError(err);
        // show Vietnamese message as toast
        toast({ title: mapped.message });
      },
    })
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Thêm danh mục</DialogTitle>
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
                    onValueChange={(v) =>
                      field.onChange(v as FormValues["type"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
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

            {/* Thứ tự removed per request */}
          </div>

          {/* server errors are shown as toast */}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Tạo danh mục"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
