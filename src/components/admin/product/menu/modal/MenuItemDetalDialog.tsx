"use client";

import { useEffect, useMemo, useState, useRef } from "react";

import Image from "next/image";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import { useMenuItemDetailQuery } from "@/hooks/admin/useMenu";

import { useUpdateMenuItemMutation } from "@/hooks/admin/useMenu";

import { useCategoriesQuery } from "@/hooks/admin/useCategory";

import { IngredientCombobox } from "./IngredientCombobox";

import { UomPicker } from "./UomPicker";

import { cn } from "@/lib/utils";

function formatVND(x: string | number) {
  const num = typeof x === "string" ? Number(x) : x;

  if (Number.isNaN(num)) return String(x);

  return num.toLocaleString("vi-VN", {
    style: "currency",

    currency: "VND",

    maximumFractionDigits: 0,
  });
}

// Hàm chặn ký tự lạ cho ô số

const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["-", "+", "e", "E"].includes(e.key)) {
    e.preventDefault();
  }
};

type Props = { id?: string; open: boolean; onOpenChange: (v: boolean) => void };

export default function MenuItemDetailDialog({
  id,

  open,

  onOpenChange,
}: Props) {
  const detailQuery = useMenuItemDetailQuery(id);

  const updateMut = useUpdateMenuItemMutation();

  const { data: categoriesResp, isLoading: catLoading } = useCategoriesQuery({
    type: "MENU",

    page: 1,

    limit: 50,
  });

  const categories = categoriesResp?.data ?? [];

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<{
    name: string;

    price: string;

    description: string;

    categoryId: string | "";

    isAvailable: boolean;

    isReturnable: boolean;

    ingredients: Array<{
      inventoryItemId: string;

      quantity: number | string;

      uomCode?: string;

      baseUnit?: string;

      note?: string;
    }>;

    imageFile: File | null;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (detailQuery.data && open) {
      const d = detailQuery.data;

      setForm({
        name: d.name,

        price: String(Number(d.price) || 0),

        description: d.description ?? "",

        categoryId: d.category?.id ?? "",

        isAvailable: !!d.isAvailable,

        isReturnable: !!(d as any).isReturnable,

        ingredients: (d.ingredients ?? []).map((ing: any) => ({
          inventoryItemId: ing.inventoryItem?.id ?? ing.inventoryItemId ?? "",

          quantity: String(Number(ing.selectedQty ?? ing.quantity) || 0),

          uomCode:
            ing.selectedUom?.code ?? ing.inventoryItem?.baseUom?.code ?? "",

          baseUnit:
            ing.inventoryItem?.baseUom?.name ?? ing.selectedUom?.name ?? "",

          note: ing.note ?? "",
        })),

        imageFile: null,
      });

      setEditing(false);
    }
  }, [detailQuery.data, open]);

  const busy = detailQuery.isLoading || updateMut.isPending;

  const loadingRefs = catLoading;

  // --- VALIDATION LOGIC ---

  const validation = useMemo(() => {
    // SỬA LỖI 1: Ép kiểu {} thành Record<string, boolean> để TS không báo lỗi khi truy cập .price, .name

    if (!form)
      return {
        valid: false,

        errors: {} as Record<string, boolean>,

        invalidIngredientsIndices: [],
      };

    const errors: Record<string, boolean> = {};

    let valid = true;

    // 1. Validate Name

    if (!form.name.trim()) {
      errors.name = true;

      valid = false;
    }

    // 2. Validate Price

    const priceStr = String(form.price).replace(/,/g, "").trim();

    const parsedPrice = Number(priceStr);

    if (
      !priceStr ||
      !/^\d+$/.test(priceStr) ||
      Number.isNaN(parsedPrice) ||
      parsedPrice < 0
    ) {
      errors.price = true;

      valid = false;
    }

    // 3. Validate Category (Thường là bắt buộc)

    if (!form.categoryId) {
      errors.categoryId = true;

      valid = false;
    }

    // 4. Validate Ingredients

    const invalidIngredientsIndices = form.ingredients.map((i) => {
      if (!i.inventoryItemId) return true;

      if (!i.uomCode) return true;

      const q =
        typeof i.quantity === "string" ? Number(i.quantity) : i.quantity;

      return Number.isNaN(q) || q <= 0;
    });

    if (invalidIngredientsIndices.some(Boolean)) {
      valid = false;
    }

    return { valid, errors, invalidIngredientsIndices };
  }, [form]);

  const onSave = async () => {
    if (!id || !form || !validation.valid) return;

    await updateMut.mutateAsync({
      id,

      name: form.name,

      price: parseInt(String(form.price).replace(/,/g, "").trim(), 10),

      description: form.description,

      categoryId: form.categoryId || undefined,

      isAvailable: form.isAvailable,

      isReturnable: form.isReturnable,

      ingredients: form.ingredients.filter((i) => i.inventoryItemId),

      image: form.imageFile ?? undefined,
    } as any);

    setEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Chi tiết món</DialogTitle>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="py-6 text-center">Đang tải…</div>
        ) : detailQuery.error ? (
          <div className="py-6 text-center text-red-500">
            {detailQuery.error.message}
          </div>
        ) : detailQuery.data && form ? (
          <div className="space-y-6">
            <div className="flex gap-4">
              {/* --- CỘT ẢNH --- */}

              {editing ? (
                <div className="shrink-0 flex flex-col gap-2 items-start">
                  <div className="w-28 h-28 rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="w-28 h-28 object-cover"
                      />
                    ) : detailQuery.data?.image ? (
                      <Image
                        src={detailQuery.data.image}
                        alt={form.name}
                        width={112}
                        height={112}
                        unoptimized
                        className="w-28 h-28 object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Không có ảnh
                      </span>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;

                      setForm((s) => (s ? { ...s, imageFile: f } : s));

                      if (imagePreview) URL.revokeObjectURL(imagePreview);

                      if (f) setImagePreview(URL.createObjectURL(f));
                      else setImagePreview(null);
                    }}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Chọn ảnh
                    </Button>

                    {imagePreview && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setForm((s) => (s ? { ...s, imageFile: null } : s));

                          if (imagePreview) URL.revokeObjectURL(imagePreview);

                          setImagePreview(null);

                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-lg overflow-hidden border shrink-0 bg-muted/30 flex items-center justify-center">
                  {detailQuery.data?.image ? (
                    <Image
                      src={detailQuery.data.image}
                      alt={form?.name}
                      width={112}
                      height={112}
                      className="object-cover w-28 h-28"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No img
                    </span>
                  )}
                </div>
              )}

              {/* --- CỘT THÔNG TIN --- */}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
                <div className="lg:col-span-2">
                  <Label className="mb-1 block">
                    Tên món <span className="text-red-500">*</span>
                  </Label>

                  {editing ? (
                    <>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm((s) =>
                            s ? { ...s, name: e.target.value } : s
                          )
                        }
                        className={
                          validation.errors.name
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }
                      />

                      {validation.errors.name && (
                        <span className="text-[11px] text-red-500">
                          Tên không được để trống
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="text-lg font-semibold">
                      {detailQuery.data.name}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="mb-1 block">
                    Danh mục <span className="text-red-500">*</span>
                  </Label>

                  {editing ? (
                    <>
                      <Select
                        value={form.categoryId}
                        onValueChange={(v) =>
                          setForm((s) => (s ? { ...s, categoryId: v } : s))
                        }
                        disabled={loadingRefs}
                      >
                        <SelectTrigger
                          className={
                            validation.errors.categoryId ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>

                        <SelectContent>
                          {categories.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {validation.errors.categoryId && (
                        <span className="text-[11px] text-red-500">
                          Vui lòng chọn danh mục
                        </span>
                      )}
                    </>
                  ) : (
                    <div>{detailQuery.data.category?.name ?? "—"}</div>
                  )}
                </div>

                <div>
                  <Label className="mb-1 block">
                    Giá bán <span className="text-red-500">*</span>
                  </Label>

                  {editing ? (
                    <>
                      <Input
                        type="number"
                        min={0}
                        onKeyDown={blockInvalidChar} // Chặn ký tự lạ
                        value={form.price}
                        onChange={(e) =>
                          setForm((s) =>
                            s ? { ...s, price: e.target.value } : s
                          )
                        }
                        className={
                          validation.errors.price
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }
                      />

                      {validation.errors.price && (
                        <span className="text-[11px] text-red-500">
                          Giá không hợp lệ
                        </span>
                      )}
                    </>
                  ) : (
                    <div>{formatVND(detailQuery.data.price)}</div>
                  )}
                </div>

                {/* Trạng thái & Checkbox */}

                <div className="lg:col-span-2">
                  <Label className="mb-1 block">Trạng thái</Label>

                  {editing ? (
                    <>
                      <Select
                        value={form.isAvailable ? "true" : "false"}
                        onValueChange={(v) =>
                          setForm((s) =>
                            s ? { ...s, isAvailable: v === "true" } : s
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="true">Sẵn sàng</SelectItem>

                          <SelectItem value="false">Tạm ẩn</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="mt-3 flex items-center gap-2">
                        <input
                          id="detail-is-returnable"
                          type="checkbox"
                          checked={form.isReturnable}
                          onChange={(e) =>
                            setForm((s) =>
                              s ? { ...s, isReturnable: e.target.checked } : s
                            )
                          }
                          className="accent-blue-600 w-4 h-4"
                        />

                        <Label
                          htmlFor="detail-is-returnable"
                          className="cursor-pointer text-sm"
                        >
                          Cho phép khách trả lại món này
                        </Label>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div>
                        {detailQuery.data.isAvailable ? "Sẵn sàng" : "Tạm ẩn"}
                      </div>

                      <div className="text-sm text-muted-foreground mt-1">
                        {(detailQuery.data as any).isReturnable
                          ? "Cho phép khách trả lại: Có"
                          : "Cho phép khách trả lại: Không"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <Label className="mb-1 block">Mô tả</Label>

                  {editing ? (
                    <Textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm((s) =>
                          s ? { ...s, description: e.target.value } : s
                        )
                      }
                    />
                  ) : (
                    <div>{detailQuery.data.description ?? "—"}</div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== NGUYÊN LIỆU ===== */}

            <div>
              <div className="font-medium mb-2">Nguyên liệu</div>

              {editing ? (
                <div className="rounded-lg border bg-white p-3 max-h-[260px] overflow-y-auto space-y-2">
                  {form.ingredients.map((it, idx) => {
                    const isRowError =
                      validation.invalidIngredientsIndices?.[idx];

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "grid grid-cols-[minmax(0,4fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,3fr)_80px] gap-2 items-start p-2 rounded",

                          isRowError ? "bg-red-50 border border-red-200" : ""
                        )}
                      >
                        <div className="min-w-0">
                          <IngredientCombobox
                            value={it.inventoryItemId}
                            onChange={(id, item) => {
                              const arr = [...form.ingredients];

                              arr[idx] = {
                                ...arr[idx],

                                inventoryItemId: id,

                                uomCode: item?.unit ?? arr[idx].uomCode ?? "",

                                baseUnit:
                                  item?.baseUomName ?? arr[idx].baseUnit ?? "",
                              };

                              setForm((s) =>
                                s ? { ...s, ingredients: arr } : s
                              );
                            }}
                            disabled={busy}
                          />

                          {/* Hiển thị lỗi thiếu nguyên liệu */}

                          {isRowError && !it.inventoryItemId && (
                            <span className="text-[10px] text-red-500 ml-1">
                              Chọn NL
                            </span>
                          )}
                        </div>

                        <div>
                          <UomPicker
                            inventoryItemId={it.inventoryItemId}
                            baseUnit={it.baseUnit}
                            value={it.uomCode ?? ""}
                            onChange={(v) => {
                              const arr = [...form.ingredients];

                              arr[idx] = { ...arr[idx], uomCode: v };

                              setForm((s) =>
                                s ? { ...s, ingredients: arr } : s
                              );
                            }}
                            disabled={busy || !it.inventoryItemId}
                          />
                        </div>

                        <div>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            onKeyDown={blockInvalidChar}
                            placeholder="SL"
                            value={String(it.quantity)}
                            onChange={(e) => {
                              const arr = [...form.ingredients];

                              arr[idx] = {
                                ...arr[idx],

                                quantity: e.target.value,
                              };

                              setForm((s) =>
                                s ? { ...s, ingredients: arr } : s
                              );
                            }}
                            className={
                              isRowError && Number(it.quantity) <= 0
                                ? "border-red-500 h-10"
                                : "h-10"
                            }
                          />
                        </div>

                        <div className="min-w-0">
                          <Input
                            placeholder="Ghi chú"
                            value={it.note ?? ""}
                            onChange={(e) => {
                              const arr = [...form.ingredients];

                              arr[idx] = { ...arr[idx], note: e.target.value };

                              setForm((s) =>
                                s ? { ...s, ingredients: arr } : s
                              );
                            }}
                            className="h-10 w-full"
                          />
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-10"
                          onClick={() =>
                            setForm((s) =>
                              s
                                ? {
                                    ...s,

                                    ingredients: s.ingredients.filter(
                                      (_, i) => i !== idx
                                    ),
                                  }
                                : s
                            )
                          }
                        >
                          Xóa
                        </Button>
                      </div>
                    );
                  })}

                  <Button
                    variant="secondary"
                    onClick={() =>
                      setForm((s) =>
                        s
                          ? {
                              ...s,

                              ingredients: [
                                ...s.ingredients,

                                {
                                  inventoryItemId: "",

                                  quantity: 1,

                                  uomCode: "",
                                },
                              ],
                            }
                          : s
                      )
                    }
                  >
                    + Thêm dòng
                  </Button>
                </div>
              ) : (
                <>
                  {(detailQuery.data.ingredients ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Không có nguyên liệu
                    </div>
                  ) : (
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      {detailQuery.data.ingredients.map((ing: any) => (
                        <li key={ing.id}>
                          {ing.inventoryItem?.name} — SL:{" "}
                          {Number(
                            ing.selectedQty ?? ing.quantity
                          ).toLocaleString()}{" "}
                          {ing.selectedUom?.name ??
                            ing.inventoryItem?.baseUom?.name ??
                            (ing.inventoryItem as any)?.baseUomName ??
                            ""}{" "}
                          {ing.note && `(${ing.note})`}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Combo Display (Readonly) */}

            {detailQuery.data.isCombo && (
              <div>
                <div className="font-medium mb-2">Thành phần combo</div>

                {/* SỬA LỖI 2: Thêm Optional Chaining (?.) vào .map */}

                {(detailQuery.data.components?.length ?? 0) > 0 ? (
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    {detailQuery.data.components?.map((c: any) => (
                      <li key={c.id}>
                        {c.item?.name} — SL: {c.quantity}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">Trống</div>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              {!editing ? (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Đóng
                  </Button>

                  <Button
                    onClick={() => setEditing(true)}
                    disabled={busy || loadingRefs}
                  >
                    Sửa
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditing(false);

                      setForm(null);
                    }}
                    disabled={busy}
                  >
                    Hủy
                  </Button>

                  {/* Nút lưu sẽ bị disable nếu form không valid */}

                  <Button onClick={onSave} disabled={!validation.valid || busy}>
                    {busy ? "Đang lưu…" : "Lưu thay đổi"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
