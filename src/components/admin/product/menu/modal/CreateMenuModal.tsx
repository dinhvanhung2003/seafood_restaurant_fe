"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Package,
  Info,
  ChefHat,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/axios";
import { IngredientCombobox } from "./IngredientCombobox";
import { UomPicker } from "./UomPicker";

/* ================== UTILS ================== */
const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["-", "+", "e", "E"].includes(e.key)) {
    e.preventDefault();
  }
};

/* ================== TYPES ================== */
export type CategoryOption = { id: string; name: string };
export type IngredientInput = {
  inventoryItemId: string;
  quantity: number;
  note?: string;
  uomCode?: string;
  baseUnit?: string;
};

export type CreateMenuItemForm = {
  name: string;
  price: number | string;
  description?: string;
  image?: FileList;
  categoryId: string;
  ingredients: IngredientInput[];
  isReturnable?: boolean;
};

/* ================== API calls ================== */
async function fetchCategoryOptions(): Promise<CategoryOption[]> {
  const res = await api.get("/category/list-category", {
    params: { isActive: true, type: "MENU", limit: 100, sort: "name:ASC" },
  });
  const list = res.data?.data ?? [];
  return list.map((c: any) => ({ id: c.id, name: c.name })) as CategoryOption[];
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
        uomCode: g.uomCode,
      }))
    )
  );
  const file = values.image?.[0];
  if (file) fd.append("image", file);
  fd.append("isReturnable", String(values.isReturnable ?? false));

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

  const categoriesQuery = useQuery({
    queryKey: ["category-options"],
    queryFn: fetchCategoryOptions,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateMenuItemForm>({
    defaultValues: {
      name: "",
      price: "",
      description: "",
      categoryId: "",
      isReturnable: false,
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
      qc.invalidateQueries({ queryKey: ["menuitems"], exact: false });
      setOpen(false);
      reset();
      onCreated?.();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Có lỗi xảy ra khi tạo món");
    },
  });

  const onSubmit = handleSubmit((vals) => {
    if (vals.ingredients.length === 0) {
      alert("Vui lòng thêm ít nhất 1 nguyên liệu");
      return;
    }
    const hasEmptyItem = vals.ingredients.some(
      (i) => !i.inventoryItemId || i.inventoryItemId === ""
    );
    if (hasEmptyItem) {
      vals.ingredients.forEach((item, index) => {
        if (!item.inventoryItemId) {
          setError(`ingredients.${index}.inventoryItemId`, {
            type: "manual",
            message: "Bắt buộc chọn",
          });
        }
      });
      return;
    }

    // Validate price > 0
    const priceNum = Number(vals.price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError("price", {
        type: "manual",
        message: "Giá phải lớn hơn 0",
      });
      return;
    }

    // Validate quantities > 0 per row
    let hasQtyError = false;
    vals.ingredients.forEach((item, index) => {
      const q = Number(item.quantity);
      if (Number.isNaN(q) || q <= 0) {
        hasQtyError = true;
        setError(`ingredients.${index}.quantity`, {
          type: "manual",
          message: "Số lượng phải lớn hơn 0",
        });
      }
    });
    if (hasQtyError) return;

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (
      !uuidRe.test(vals.categoryId) ||
      vals.ingredients.some((i) => !uuidRe.test(i.inventoryItemId))
    ) {
      alert("Dữ liệu không hợp lệ (ID lỗi)");
      return;
    }

    mutation.mutate(vals);
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const clearImage = () => {
    setValue("image", undefined);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 font-medium shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[950px] lg:max-w-[1150px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gray-50/90">
        <DialogHeader className="px-6 py-4 bg-white border-b sticky top-0 z-20 shadow-sm">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Thêm món mới
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cột trái: Ảnh món ăn (4 columns) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b pb-3 mb-4">
                  <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2">
                    Ảnh đại diện
                  </h3>
                </div>

                {previewUrl ? (
                  <div className="relative rounded-md overflow-hidden border border-gray-200 aspect-video w-full group shadow-inner">
                    <Image
                      src={previewUrl}
                      alt="Xem trước"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={clearImage}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Xóa ảnh
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-md aspect-video w-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 hover:bg-gray-100 hover:border-blue-400 transition cursor-pointer relative group">
                    <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                      <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <span className="text-sm font-medium">Tải ảnh lên</span>
                    <Input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      {...register("image", {
                        validate: (fl) => {
                          const f = fl?.[0];
                          if (!f) return true;
                          if (!/^image\//.test(f.type))
                            return "Chỉ chọn file ảnh";
                          if (f.size > 5 * 1024 * 1024)
                            return "Kích thước tối đa 5MB";
                          return true;
                        },
                      })}
                    />
                  </div>
                )}

                {errors.image && (
                  <p className="text-xs text-red-500 mt-2 font-medium flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />{" "}
                    {String(errors.image.message)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Hỗ trợ: JPG, PNG, WEBP. Tối đa 5MB.
                </p>
              </div>
            </div>

            {/* Cột phải: Thông tin & Nguyên liệu (8 columns) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Card 1: Thông tin chung */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="border-b pb-3 mb-5 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-base text-gray-800">
                    Thông tin chung
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="font-medium text-sm">
                      Tên món <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="VD: Lẩu Thái Tomyum"
                      {...register("name", {
                        required: "Vui lòng nhập tên món",
                      })}
                      className={errors.name ? "border-red-500 bg-red-50" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium text-sm">
                      Giá bán (VND) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      {/* --- SỬA Ở ĐÂY: Thêm class CSS để ẩn nút spinner mũi tên --- */}
                      <Input
                        type="number"
                        min={1}
                        onKeyDown={blockInvalidChar}
                        placeholder="0"
                        {...register("price", {
                          required: "Vui lòng nhập giá",
                          min: {
                            value: 1,
                            message: "Giá phải lớn hơn 0",
                          },
                          valueAsNumber: true,
                        })}
                        className={`${
                          errors.price
                            ? "border-red-500 bg-red-50 pr-8"
                            : "pr-8"
                        } [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">
                        đ
                      </span>
                    </div>
                    {errors.price && (
                      <p className="text-xs text-red-500">
                        {errors.price.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-sm">
                      Danh mục <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="categoryId"
                      rules={{ required: "Vui lòng chọn danh mục" }}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            className={
                              errors.categoryId
                                ? "border-red-500 bg-red-50"
                                : ""
                            }
                          >
                            <SelectValue placeholder="-- Chọn danh mục --" />
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
                      <p className="text-xs text-red-500">
                        {errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center pt-8">
                    <Controller
                      control={control}
                      name="isReturnable"
                      render={({ field }) => (
                        <div
                          className="flex items-center space-x-2 border px-3 py-2 rounded-md bg-gray-50/50 w-full hover:bg-gray-100 transition cursor-pointer"
                          onClick={() => field.onChange(!field.value)}
                        >
                          <input
                            type="checkbox"
                            id="isReturnable"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label
                            htmlFor="isReturnable"
                            className="cursor-pointer text-sm font-medium text-gray-700 select-none"
                          >
                            Cho phép khách trả lại món
                          </Label>
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="font-medium text-sm">Mô tả</Label>
                  <Textarea
                    placeholder="Mô tả chi tiết về thành phần, hương vị..."
                    {...register("description")}
                    className="resize-none min-h-[80px]"
                  />
                </div>
              </div>

              {/* Card 2: Nguyên liệu */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
                <div className="border-b pb-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-base text-gray-800">
                      Định lượng nguyên liệu
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        inventoryItemId: "",
                        quantity: 1,
                        note: "",
                        uomCode: "",
                        baseUnit: "",
                      })
                    }
                    className="text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100 h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Thêm dòng
                  </Button>
                </div>

                <div className="rounded-md border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0 z-10 text-gray-700 font-semibold border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2.5 text-left w-[35%] text-xs uppercase tracking-wider">
                            Nguyên liệu <span className="text-red-500">*</span>
                          </th>
                          <th className="px-4 py-2.5 text-left w-[15%] text-xs uppercase tracking-wider">
                            Số lượng <span className="text-red-500">*</span>
                          </th>
                          <th className="px-4 py-2.5 text-left w-[20%] text-xs uppercase tracking-wider">
                            Đơn vị <span className="text-red-500">*</span>
                          </th>
                          <th className="px-4 py-2.5 text-left w-[25%] text-xs uppercase tracking-wider">
                            Ghi chú
                          </th>
                          <th className="px-2 py-2.5 w-[5%]"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {fields.map((f, idx) => {
                          const hasErrorItem =
                            errors.ingredients?.[idx]?.inventoryItemId;
                          const selectedItem = (
                            watch("ingredients") as any[]
                          )?.[idx];

                          return (
                            <tr
                              key={f.id}
                              className="hover:bg-blue-50/30 group transition-colors"
                            >
                              <td className="px-4 py-2 align-top">
                                <Controller
                                  control={control}
                                  name={`ingredients.${idx}.inventoryItemId`}
                                  rules={{ required: "Bắt buộc chọn" }}
                                  render={({ field }) => (
                                    <IngredientCombobox
                                      value={field.value}
                                      onChange={(value, item) => {
                                        field.onChange(value);
                                        clearErrors(
                                          `ingredients.${idx}.inventoryItemId`
                                        );
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
                                  )}
                                />
                                {hasErrorItem && (
                                  <span className="text-[10px] text-red-500 block mt-1 font-medium">
                                    {hasErrorItem.message}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 align-top">
                                {/* --- SỬA Ở ĐÂY: Ẩn spinner cho ô số lượng --- */}
                                <Input
                                  type="number"
                                  min={1}
                                  step="any"
                                  onKeyDown={blockInvalidChar}
                                  {...register(`ingredients.${idx}.quantity`, {
                                    valueAsNumber: true,
                                    min: {
                                      value: 1,
                                      message: "Số lượng phải lớn hơn 0",
                                    },
                                    required: "Bắt buộc",
                                  })}
                                  className="h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                {errors.ingredients?.[idx]?.quantity && (
                                  <div className="text-[11px] text-red-500 mt-1">
                                    {String(
                                      errors.ingredients[idx].quantity?.message
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2 align-top">
                                <Controller
                                  control={control}
                                  name={`ingredients.${idx}.uomCode`}
                                  rules={{ required: true }}
                                  render={({ field }) => (
                                    <UomPicker
                                      inventoryItemId={
                                        selectedItem?.inventoryItemId
                                      }
                                      baseUnit={selectedItem?.baseUnit}
                                      value={field.value ?? ""}
                                      onChange={field.onChange}
                                      disabled={!selectedItem?.inventoryItemId}
                                    />
                                  )}
                                />
                              </td>
                              <td className="px-4 py-2 align-top">
                                <Input
                                  {...register(`ingredients.${idx}.note`)}
                                  placeholder="Ghi chú..."
                                  className="h-9"
                                />
                              </td>
                              <td className="px-2 py-2 align-top text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                  onClick={() => remove(idx)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {fields.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-10 text-center text-gray-400 flex flex-col items-center justify-center gap-2"
                            >
                              <Package className="w-8 h-8 opacity-20" />
                              <span className="text-sm">
                                Chưa có nguyên liệu nào. Vui lòng thêm nguyên
                                liệu.
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 pt-4 border-t sticky bottom-0 bg-white z-20 pb-2 flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              className="px-6"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 px-8 font-semibold shadow-md"
            >
              {mutation.isPending ? "Đang xử lý..." : "Tạo món mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
