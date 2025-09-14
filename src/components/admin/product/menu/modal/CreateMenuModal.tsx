"use client";

import { useState,useEffect} from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/axios";

/* ================== TYPES ================== */
export type CategoryOption = { id: string; name: string };
export type InventoryItemOption = {
  id: string;
  name: string;      // label hiển thị
  unit: string;
  onHand: number;    // quantity parse về number
};
function toNumber(n: any) {
  // PG numeric -> "50.000" => 50
  if (n == null) return 0;
  return Number(String(n).replace(/,/g, ''));
}
export type IngredientInput = {
  inventoryItemId: string;
  quantity: number;
  note?: string;
};

export type CreateMenuItemForm = {
  name: string;
  price: string;            // gửi dạng string trong multipart
  description?: string;
  image?: FileList;         // RHF trả FileList
  categoryId: string;
  ingredients: IngredientInput[];
};

/* ================== API calls (axios) ================== */
async function fetchCategoryOptions(): Promise<CategoryOption[]> {
  const res = await api.get("/category/list-category", {
    params: { isActive: true, type: "MENU", limit: 100, sort: "name:ASC" },
  });
  const list = res.data?.data ?? [];
  return list.map((c: any) => ({ id: c.id, name: c.name })) as CategoryOption[];
}

async function fetchInventoryOptions(): Promise<InventoryItemOption[]> {
  const res = await api.get("/inventoryitems/list-ingredients", {
    params: { limit: 200, sort: "name:ASC", isActive: true },
  });
  const list: any[] = res.data?.data ?? res.data ?? [];
  return list.map(i => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    onHand: toNumber(i.quantity),
  }));
}

async function createMenuItem(values: CreateMenuItemForm) {
  const fd = new FormData();
  fd.append("name", values.name.trim());
  fd.append("price", String(values.price));
  if (values.description) fd.append("description", values.description);
  fd.append("categoryId", values.categoryId);
  fd.append(
    "ingredients",
    JSON.stringify(
      values.ingredients.map((g) => ({
        inventoryItemId: g.inventoryItemId,
        quantity: Number(g.quantity),
        note: g.note ?? undefined,
      }))
    )
  );
  const file = values.image?.[0];
  if (file) fd.append("image", file); // axios sẽ tự set Content-Type + boundary

  const res = await api.post("/menuitems/create-menuitem", fd);
  return res.data;
}

/* ================== COMPONENT ================== */
export default function CreateMenuItemDialog({
  triggerLabel = "Thêm món",
  onCreated,
}: {
  triggerLabel?: string;
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  // options
  const categoriesQuery = useQuery({
    queryKey: ["category-options"],
    queryFn: fetchCategoryOptions,
  });
  const inventoryQuery = useQuery({
    queryKey: ["inventory-options"],
    queryFn: fetchInventoryOptions,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch, setValue,
    formState: { errors },
  } = useForm<CreateMenuItemForm>({
    defaultValues: {
      name: "",
      price: "",
      description: "",
      categoryId: "",
      ingredients: [{ inventoryItemId: "", quantity: 1, note: "" }],
    },
    mode: "onTouched",
  });

  const { fields, append, remove } = useFieldArray({
    name: "ingredients",
    control,
  });

  const mutation = useMutation({
    mutationFn: (vals: CreateMenuItemForm) => createMenuItem(vals),
    onSuccess: () => {
      // reload list hiện tại
      qc.invalidateQueries({ queryKey: ["menuitems"], exact: false });
      setOpen(false);
      reset();
      onCreated?.();
    },
  });

  const onSubmit = handleSubmit((vals) => {
  // Lọc bỏ dòng chưa chọn nguyên liệu
  const cleaned = {
    ...vals,
    ingredients: vals.ingredients
      .filter(g => g.inventoryItemId && String(g.inventoryItemId).length > 0)
      .map(g => ({
        inventoryItemId: String(g.inventoryItemId),
        quantity: Number(g.quantity),
        note: g.note?.trim() || undefined,
      })),
  };

  if (!cleaned.categoryId) {
    alert("Vui lòng chọn danh mục");
    return;
  }
  if (cleaned.ingredients.length === 0) {
    alert("Vui lòng thêm ít nhất 1 nguyên liệu");
    return;
  }

  // (tuỳ chọn) kiểm tra pattern UUID để báo sớm trên FE
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(cleaned.categoryId) || cleaned.ingredients.some(i => !uuidRe.test(i.inventoryItemId))) {
    alert("Dữ liệu không hợp lệ (ID không phải UUID)");
    return;
  }
console.log("Payload gửi:", cleaned);

  mutation.mutate(cleaned);
});


 

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Lấy file từ RHF và tạo preview URL
  const imageFiles = watch("image");
  useEffect(() => {
    if (!imageFiles || imageFiles.length === 0) {
      setPreviewUrl(null);
      return;
    }
    const file = imageFiles[0];
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFiles]);

  // Clear ảnh đang chọn
  const clearImage = () => {
    setValue("image", undefined);        // reset field RHF
    setPreviewUrl(null);
  };






  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Thêm món</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tên món *</Label>
              <Input
                placeholder="Lẩu Tomyum"
                {...register("name", { required: "Vui lòng nhập tên món" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label>Giá (VND) *</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="250000"
                {...register("price", { required: "Vui lòng nhập giá" })}
              />
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea
              placeholder="Món lẩu tôm yum ngon"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Danh mục *</Label>
              <Controller
                control={control}
                name="categoryId"
                rules={{ required: "Vui lòng chọn danh mục" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          categoriesQuery.isLoading
                            ? "Đang tải..."
                            : "Chọn danh mục"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(categoriesQuery.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.categoryId.message as string}
                </p>
              )}
            </div>

           <div>
  <Label>Ảnh món (tùy chọn)</Label>

  {/* Input file */}
  <Input
    type="file"
    accept="image/*"
    {...register("image", {
      validate: (fl) => {
        const f = fl?.[0];
        if (!f) return true;
        const maxMB = 5;
        const okType = /^image\//.test(f.type);
        const okSize = f.size <= maxMB * 1024 * 1024;
        if (!okType) return "Chỉ chọn file ảnh";
        if (!okSize) return `Kích thước tối đa ${maxMB}MB`;
        return true;
      },
    })}
  />

  {/* Preview */}
  {previewUrl && (
    <div className="relative mt-2 rounded-lg overflow-hidden border">
      {/* Dùng next/image nếu có Next.js, nó tối ưu hơn */}
      <Image
        src={previewUrl}
        alt="Xem trước ảnh món"
        width={800}
        height={450}
        className="w-full h-auto object-cover"
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2"
        onClick={clearImage}
        title="Gỡ ảnh"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )}

  {/* Lỗi validate nếu có */}
  {errors.image && (
    <p className="text-sm text-red-500 mt-1">
      {String(errors.image.message)}
    </p>
  )}
</div>
          </div>

          {/* Ingredients */}
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Nguyên liệu</div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  append({ inventoryItemId: "", quantity: 1, note: "" })
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Thêm dòng
              </Button>
            </div>

            <div className="grid gap-3">
              {fields.map((f, idx) => (
                <div
                  key={f.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                >
                  <div className="md:col-span-5">
                    <Label className="text-xs">Nguyên liệu *</Label>
                    <Controller
                      control={control}
                      name={`ingredients.${idx}.inventoryItemId` as const}
                      rules={{ required: "Chọn nguyên liệu" }}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                inventoryQuery.isLoading
                                  ? "Đang tải..."
                                  : "Chọn nguyên liệu"
                              }
                            />
                          </SelectTrigger>
                     <SelectContent>
  {(inventoryQuery.data ?? []).map(item => (
    <SelectItem key={item.id} value={item.id}>
      {item.name} ({item.unit}) — còn {item.onHand}
    </SelectItem>
  ))}
</SelectContent>


                        </Select>
                      )}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs">Số lượng *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      {...register(
                        `ingredients.${idx}.quantity` as const,
                        {
                          valueAsNumber: true,
                          min: { value: 0, message: ">= 0" },
                        }
                      )}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-xs">Ghi chú</Label>
                    <Input
                      {...register(`ingredients.${idx}.note` as const)}
                      placeholder="Tươi / hộp / lon..."
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => remove(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {mutation.error && (
            <p className="text-sm text-red-500">
              {(mutation.error as Error).message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Tạo món"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
