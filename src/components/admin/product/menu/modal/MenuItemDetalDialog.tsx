// components/admin/menu/MenuItemDetailDialog.tsx
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

function formatVND(x: string | number) {
  const num = typeof x === "string" ? Number(x) : x;
  if (Number.isNaN(num)) return String(x);
  return num.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

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
    // keep price as string while editing so user can type freely (e.g. empty/partial)
    price: string;
    description: string;
    categoryId: string | "";
    isAvailable: boolean;
    isReturnable: boolean;
    ingredients: Array<{
      inventoryItemId: string;
      // allow string during edit so user can type freely (e.g. empty while editing)
      quantity: number | string;
      uomCode?: string;
      baseUnit?: string;
      note?: string;
    }>;
    imageFile: File | null;
  } | null>(null);

  // Reset preview khi mở lại modal hoặc data thay đổi
  // useEffect(() => {
  //   if (open) setImagePreview(null);
  // }, [open, detailQuery.data]);
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Map data BE -> form state
  useEffect(() => {
    if (detailQuery.data && open) {
      const d = detailQuery.data;

      setForm({
        name: d.name,
        // store as string for editable input
        price: String(Number(d.price) || 0),
        description: d.description ?? "",
        categoryId: d.category?.id ?? "",
        isAvailable: !!d.isAvailable,
        isReturnable: !!(d as any).isReturnable,
        ingredients: (d.ingredients ?? []).map((ing: any) => ({
          inventoryItemId: ing.inventoryItem?.id ?? ing.inventoryItemId ?? "",
          // store as string so input is editable; convert on save
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

  const canSave = useMemo(() => {
    if (!editing || !form) return false;
    if (!form.name) return false;
    // price must be a non-empty integer >= 0
    const priceStr = String(form.price).replace(/,/g, "").trim();
    if (!priceStr) return false;
    if (!/^\d+$/.test(priceStr)) return false;
    const parsedPrice = Number(priceStr);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) return false;
    const badIng = form.ingredients.some((i) => {
      if (!i.inventoryItemId) return true;
      if (!i.uomCode) return true;
      const q =
        typeof i.quantity === "string" ? Number(i.quantity) : i.quantity;
      return Number.isNaN(q) || q <= 0;
    });
    return !badIng;
  }, [editing, form]);

  const onSave = async () => {
    if (!id || !form) return;

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
            {/* ===== Header: ảnh + thông tin chính ===== */}
            <div className="flex gap-4">
              {/* Ảnh món */}
              {/* Ảnh món */}
              {editing ? (
                // ======= MODE SỬA =======
                <div className="shrink-0 flex flex-col gap-2 items-start">
                  {/* khung preview cố định 28x28 */}
                  <div className="w-28 h-28 rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
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

                  {/* input file ẩn */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setForm((s) => (s ? { ...s, imageFile: f } : s));

                      if (imagePreview) URL.revokeObjectURL(imagePreview);

                      if (f) {
                        const url = URL.createObjectURL(f);
                        setImagePreview(url);
                      } else {
                        setImagePreview(null);
                      }
                    }}
                  />

                  {/* Nút chọn / bỏ ảnh mới */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Chọn ảnh khác
                    </Button>

                    {imagePreview && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setForm((s) => (s ? { ...s, imageFile: null } : s));
                          if (imagePreview) URL.revokeObjectURL(imagePreview);
                          setImagePreview(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        Bỏ ảnh mới
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                // ======= MODE XEM =======
                <div className="w-28 h-28 rounded-lg overflow-hidden border shrink-0 bg-muted/30 flex items-center justify-center">
                  {detailQuery.data?.image ? (
                    <Image
                      src={detailQuery.data.image}
                      alt={form?.name || ""}
                      width={112}
                      height={112}
                      className="object-cover w-28 h-28"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Không có ảnh
                    </div>
                  )}
                </div>
              )}

              {/* Thông tin chính */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
                {/* Tên món */}
                <div className="lg:col-span-2">
                  <Label className="mb-1 block">Tên món</Label>
                  {editing ? (
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((s) => (s ? { ...s, name: e.target.value } : s))
                      }
                    />
                  ) : (
                    <div className="text-lg font-semibold">
                      {detailQuery.data.name}
                    </div>
                  )}
                </div>

                {/* Danh mục */}
                <div>
                  <Label className="mb-1 block">Danh mục</Label>
                  {editing ? (
                    <Select
                      value={form.categoryId}
                      onValueChange={(v) =>
                        setForm((s) => (s ? { ...s, categoryId: v } : s))
                      }
                      disabled={loadingRefs}
                    >
                      <SelectTrigger>
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
                  ) : (
                    <div>{detailQuery.data.category?.name ?? "—"}</div>
                  )}
                </div>

                {/* Giá bán */}
                <div>
                  <Label className="mb-1 block">Giá bán</Label>
                  {editing ? (
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={form.price}
                      onChange={(e) =>
                        setForm((s) =>
                          s ? { ...s, price: e.target.value } : s
                        )
                      }
                    />
                  ) : (
                    <div>{formatVND(detailQuery.data.price)}</div>
                  )}
                </div>

                {/* Trạng thái + cho phép trả */}
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

                {/* Mô tả */}
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

            {/* ===== Nguyên liệu ===== */}
            <div>
              <div className="font-medium mb-2">Nguyên liệu</div>
              {editing ? (
                <div className="rounded-lg border bg-white p-3 max-h-[260px] overflow-y-auto space-y-2">
                  {form.ingredients.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[minmax(0,4fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,3fr)_80px] gap-2 items-center"
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
                      </div>

                      <div>
                        <UomPicker
                          inventoryItemId={it.inventoryItemId}
                          baseUnit={
                            it.baseUnit ??
                            ((
                              detailQuery.data?.ingredients?.find(
                                (r: any) =>
                                  r.inventoryItem?.id === it.inventoryItemId
                              ) as any
                            )?.inventoryItem?.baseUom?.name ||
                              (
                                detailQuery.data?.ingredients?.find(
                                  (r: any) =>
                                    r.inventoryItem?.id === it.inventoryItemId
                                ) as any
                              )?.selectedUom?.name) ??
                            undefined
                          }
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

                      <Input
                        className="w-full"
                        type="number"
                        inputMode="numeric"
                        step="any"
                        min={0}
                        placeholder="Số lượng"
                        value={String(it.quantity)}
                        onChange={(e) => {
                          const arr = [...form.ingredients];
                          arr[idx] = {
                            ...arr[idx],
                            quantity: e.target.value,
                          };
                          setForm((s) => (s ? { ...s, ingredients: arr } : s));
                        }}
                      />

                      <Input
                        className="w-full min-w-0"
                        placeholder="Ghi chú"
                        value={it.note ?? ""}
                        onChange={(e) => {
                          const arr = [...form.ingredients];
                          arr[idx] = { ...arr[idx], note: e.target.value };
                          setForm((s) => (s ? { ...s, ingredients: arr } : s));
                        }}
                      />

                      <div className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
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
                    </div>
                  ))}

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
                      {detailQuery.data.ingredients.map((ing: any) => {
                        const label = ing.inventoryItem?.name ?? "—";
                        // prefer selectedQty for display but fallback to quantity if selectedQty is null
                        const rawQty = ing.selectedQty ?? ing.quantity;
                        // backend may return numeric strings with separators like "1.000"; normalize
                        const qtyNum =
                          Number(String(rawQty).replace(/,/g, "")) || 0;
                        return (
                          <li key={ing.id}>
                            {label} — SL: {qtyNum.toLocaleString()}{" "}
                            {ing.selectedUom?.name ?? ing.selectedUom?.code}
                            {ing.note ? ` — ${ing.note}` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* ===== Combo (nếu có) ===== */}
            {detailQuery.data.isCombo && (
              <div>
                <div className="font-medium mb-2">Thành phần combo</div>
                {detailQuery.data.components &&
                detailQuery.data.components.length > 0 ? (
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    {detailQuery.data.components.map((c: any) => (
                      <li key={c.id}>
                        {c.item?.name ?? "—"} — SL: {c.quantity}
                        {c.note ? ` — ${c.note}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Không có thành phần
                  </div>
                )}
              </div>
            )}

            {/* ===== Footer ===== */}
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
                    onClick={() => setEditing(false)}
                    disabled={busy}
                  >
                    Hủy
                  </Button>
                  <Button onClick={onSave} disabled={!canSave || busy}>
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
