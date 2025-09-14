"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

// ===== Types =====
export type CreateCategoryPayload = {
  name: string;
  description?: string | null;
  type: "MENU" | "INGREDIENT";
  sortOrder?: number; // default 0
};

const TYPE_OPTIONS: CreateCategoryPayload["type"][] = ["MENU", "INGREDIENT"];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function createCategory(payload: CreateCategoryPayload, accessToken?: string) {
  const res = await fetch(`${API_BASE}/category/create-category`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "Tạo danh mục thất bại");
  }
  return res.json();
}

export default function CreateCategoryDialog({
  triggerLabel = "Thêm danh mục",
  defaultType = "MENU",
  onCreated,
}: {
  triggerLabel?: string;
  defaultType?: CreateCategoryPayload["type"];
  onCreated?: () => void; // parent có thể refetch/invalidate
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
    defaultValues: { name: "", description: "", type: defaultType, sortOrder: 0 },
    mode: "onTouched",
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (values: FormValues) =>
      createCategory({ ...values, sortOrder: Number(values.sortOrder ?? 0) }, (session as any)?.accessToken),
    onSuccess: () => {
      setOpen(false);
      reset();
      // Invalidate mọi query danh mục
      queryClient.invalidateQueries({ queryKey: ["categories"], exact: false });
      onCreated?.();
    },
  });

  const onSubmit = handleSubmit((values) => mutate(values));

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
              {...register("name", { required: "Vui lòng nhập tên danh mục", minLength: { value: 2, message: "Tên quá ngắn" } })}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea placeholder="Nhóm các món hải sản" {...register("description")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Loại *</Label>
              <Controller
                control={control}
                name="type"
                rules={{ required: "Vui lòng chọn loại" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as FormValues["type"])}>
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
              {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type.message as string}</p>}
            </div>

            <div>
              <Label>Thứ tự</Label>
              <Input type="number" {...register("sortOrder", { valueAsNumber: true, min: { value: 0, message: ">= 0" } })} />
              {errors.sortOrder && <p className="text-sm text-red-500 mt-1">{errors.sortOrder.message}</p>}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{(error as Error).message || "Có lỗi xảy ra"}</p>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
