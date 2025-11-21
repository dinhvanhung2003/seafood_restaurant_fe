"use client";

import { useState, useEffect } from "react";
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
import { IngredientCombobox } from "./IngredientCombobox";
import { UomPicker } from "./UomPicker"; // Import UomPicker

/* ================== TYPES ================== */
export type CategoryOption = { id: string; name: string };
export type InventoryItemOption = {
  id: string;
  name: string; // label hiển thị
  unit: string;
  onHand: number; // quantity parse về number
};
function toNumber(n: any) {
  // PG numeric -> "50.000" => 50
  if (n == null) return 0;
  return Number(String(n).replace(/,/g, ""));
}
export type IngredientInput = {
  inventoryItemId: string;
  quantity: number;
  note?: string;
  uomCode?: string;
  baseUnit?: string;
};

export type CreateMenuItemForm = {
  name: string;
  price: string; // gửi dạng string trong multipart
  description?: string;
  image?: FileList; // RHF trả FileList
  categoryId: string;
  ingredients: IngredientInput[];
  isReturnable?: boolean; // Thêm trường isReturnable
};

/* ================== API calls (axios) ================== */
async function fetchCategoryOptions(): Promise<CategoryOption[]> {
  const res = await api.get("/category/list-category", {
    params: { isActive: true, type: "MENU", limit: 100, sort: "name:ASC" },
  });
  const list = res.data?.data ?? [];
  return list.map((c: any) => ({ id: c.id, name: c.name })) as CategoryOption[];
}

// This function is no longer needed here as the combobox fetches its own data.
// async function fetchInventoryOptions(): Promise<InventoryItemOption[]> {
//   const res = await api.get("/inventoryitems/list-ingredients", {
//     params: { limit: 10, sort: "name:ASC", isActive: true },
//   });
//   const list: any[] = res.data?.data ?? res.data ?? [];
//   return list.map(i => ({
//     id: i.id,
//     name: i.name,
//     unit: i.unit,
//     onHand: toNumber(i.quantity),
//   }));
// }

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
        uomCode: g.uomCode, // Send uomCode to backend
      }))
    )
  );
  const file = values.image?.[0];
  if (file) fd.append("image", file); // axios sẽ tự set Content-Type + boundary
  fd.append("isReturnable", String(values.isReturnable ?? false)); // Gửi trường isReturnable

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
  // Remove the old inventoryQuery
  // const inventoryQuery = useQuery({ ... });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMenuItemForm>({
    defaultValues: {
      name: "",
      price: "",
      description: "",
      categoryId: "",
      ingredients: [
        {
          inventoryItemId: "",
          quantity: 1,
          note: "",
          uomCode: "",
          baseUnit: "",
        },
      ],
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
        .filter(
          (g) => g.inventoryItemId && String(g.inventoryItemId).length > 0
        )
        .map((g) => ({
          inventoryItemId: String(g.inventoryItemId),
          quantity: Number(g.quantity),
          note: g.note?.trim() || undefined,
          uomCode: g.uomCode || undefined,
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
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (
      !uuidRe.test(cleaned.categoryId) ||
      cleaned.ingredients.some((i) => !uuidRe.test(i.inventoryItemId))
    ) {
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
    setValue("image", undefined); // reset field RHF
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[900px] lg:max-w-[1100px] max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">
            Thêm món
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Cột trái: Ảnh món ăn */}
          <div className="flex flex-col gap-4 items-start justify-start">
            <Label className="mb-2 font-semibold">Ảnh món (tùy chọn)</Label>
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
              className="mb-2"
            />
            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden border w-full max-w-xs">
                <Image
                  src={previewUrl}
                  alt="Xem trước ảnh món"
                  width={320}
                  height={180}
                  className="object-cover w-full h-auto"
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
            {errors.image && (
              <p className="text-sm text-red-500 mt-1">
                {String(errors.image.message)}
              </p>
            )}
          </div>

          {/* Cột phải: Thông tin món ăn */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Tên món *</Label>
                <Input
                  placeholder="Lẩu Tomyum"
                  {...register("name", { required: "Vui lòng nhập tên món" })}
                  className="mt-1"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="font-semibold">Giá (VND) *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="250000"
                  {...register("price", {
                    required: "Vui lòng nhập giá",
                    validate: (v) => {
                      if (!v.trim()) return "Vui lòng nhập giá";
                      const n = Number(v);
                      if (Number.isNaN(n) || n < 0)
                        return "Giá phải là số >= 0";
                      return true;
                    },
                  })}
                  className="mt-1"
                />
                {errors.price && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label className="font-semibold">Mô tả</Label>
              <Textarea
                placeholder="Món lẩu tôm yum ngon"
                {...register("description")}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Controller
                control={control}
                name="isReturnable"
                defaultValue={false}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isReturnable"
                      className="w-4 h-4 accent-blue-600"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <Label
                      htmlFor="isReturnable"
                      className="cursor-pointer text-sm"
                    >
                      Cho phép khách trả lại món này
                    </Label>
                  </div>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Danh mục *</Label>
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
            </div>
          </div>

          {/* Nguyên liệu */}
          <div className="col-span-2 mt-8">
            <div className="font-semibold text-lg mb-2">Nguyên liệu</div>
            <div className="rounded-lg border bg-white max-h-[340px] overflow-y-auto overflow-x-hidden px-2">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col style={{ width: "45%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "5%" }} />
                </colgroup>
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 font-medium text-left">
                      Nguyên liệu *
                    </th>
                    <th className="px-3 py-2 font-medium text-left">
                      Số lượng *
                    </th>
                    <th className="px-3 py-2 font-medium text-left">
                      Đơn vị *
                    </th>
                    <th className="px-3 py-2 font-medium text-left">Ghi chú</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f, idx) => {
                    const inventoryItemId = watch(
                      `ingredients.${idx}.inventoryItemId`
                    );
                    const selectedItem = (watch("ingredients") as any[]).find(
                      (i) => i.inventoryItemId === inventoryItemId
                    );
                    return (
                      <tr key={f.id} className="border-b">
                        <td className="px-3 py-2 align-top">
                          <Controller
                            control={control}
                            name={`ingredients.${idx}.inventoryItemId` as const}
                            rules={{ required: "Chọn nguyên liệu" }}
                            render={({ field }) => (
                              <div className="min-w-0 w-full">
                                <IngredientCombobox
                                  value={field.value}
                                  onChange={(value, item) => {
                                    field.onChange(value);
                                    setValue(
                                      `ingredients.${idx}.uomCode`,
                                      item?.unit ?? ""
                                    );
                                    setValue(
                                      `ingredients.${idx}.baseUnit`,
                                      item?.baseUomName ?? ""
                                    );
                                  }}
                                />
                              </div>
                            )}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Input
                            type="number"
                            inputMode="numeric"
                            step="any"
                            min={0}
                            className="w-full max-w-full"
                            {...register(
                              `ingredients.${idx}.quantity` as const,
                              {
                                // allow string while typing; validate on the fly
                                validate: (v) => {
                                  const raw = v as any;
                                  if (
                                    raw === "" ||
                                    raw === null ||
                                    typeof raw === "undefined"
                                  )
                                    return true;
                                  const n = Number(raw);
                                  return (!Number.isNaN(n) && n >= 0) || ">= 0";
                                },
                              }
                            )}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Controller
                            control={control}
                            name={`ingredients.${idx}.uomCode` as const}
                            rules={{ required: "Chọn đơn vị" }}
                            render={({ field }) => (
                              <div className="min-w-0 w-full">
                                <UomPicker
                                  inventoryItemId={inventoryItemId}
                                  baseUnit={selectedItem?.baseUnit}
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                  disabled={!inventoryItemId}
                                />
                              </div>
                            )}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Input
                            className="w-full"
                            {...register(`ingredients.${idx}.note` as const)}
                            placeholder="Tươi / hộp / lon..."
                          />
                        </td>
                        <td className="px-3 py-2 text-right align-top">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => remove(idx)}
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-2 sticky bottom-0 bg-white">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    append({
                      inventoryItemId: "",
                      quantity: 1,
                      note: "",
                      uomCode: "",
                      baseUnit: "",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Thêm dòng
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="col-span-2 flex justify-end gap-3 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="font-semibold"
            >
              {mutation.isPending ? "Đang lưu..." : "Tạo món"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
