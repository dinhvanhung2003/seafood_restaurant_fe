// components/admin/menu/MenuItemDetailDialog.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMenuItemDetailQuery } from "@/hooks/admin/useMenu";
import { useUpdateMenuItemMutation } from "@/hooks/admin/useMenu";
import { useIngredients } from "@/hooks/admin/useIngredients";
import { useCategoriesQuery } from "@/hooks/admin/useCategory";
import { useRef } from "react";

function formatVND(x: string | number) {
  const num = typeof x === "string" ? Number(x) : x;
  if (Number.isNaN(num)) return String(x);
  return num.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
}

type Props = { id?: string; open: boolean; onOpenChange: (v: boolean) => void };

export default function MenuItemDetailDialog({ id, open, onOpenChange }: Props) {
  const detailQuery = useMenuItemDetailQuery(id);
  const updateMut = useUpdateMenuItemMutation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // lấy categories & ingredients từ hooks bạn đã có
  const { data: categoriesResp, isLoading: catLoading } = useCategoriesQuery({ page: 1, limit: 10 });
  const categories = categoriesResp?.data ?? [];
  const { data: ingredientsList, isLoading: ingLoading } = useIngredients();
  
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    price: number;
    description: string;
    categoryId: string | "";
    isAvailable: boolean;
    ingredients: Array<{ inventoryItemId: string; quantity: number; note?: string }>;
    imageFile: File | null;
  } | null>(null);
  useEffect(() => {
  // reset preview khi mở modal hoặc khi data thay đổi
  if (open) setImagePreview(null);
}, [open, detailQuery.data]);

const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (detailQuery.data && open) {
      const d = detailQuery.data;
      setForm({
        name: d.name,
        price: Number(d.price),
        description: d.description ?? "",
        categoryId: d.category?.id ?? "",
        isAvailable: !!d.isAvailable,
        ingredients: d.ingredients.map((ing) => ({
          // ưu tiên inventoryItem.id BE trả; nếu không có, giữ rỗng để user chọn lại
          inventoryItemId: ing.inventoryItem?.id ?? "",
          quantity: Number(ing.quantity),
          note: ing.note ?? "",
        })),
        imageFile: null,
      });
      setEditing(false);
    }
  }, [detailQuery.data, open]);

  const busy = detailQuery.isLoading || updateMut.isPending;
  const loadingRefs = catLoading || ingLoading;

  const canSave = useMemo(() => {
    if (!editing || !form) return false;
    if (!form.name || !form.price) return false;
    // nếu có dòng nguyên liệu thì inventoryItemId phải có
    const badIng = form.ingredients.some(i => !i.inventoryItemId || i.quantity <= 0);
    return !badIng;
  }, [editing, form]);

  const onSave = async () => {
    if (!id || !form) return;
    await updateMut.mutateAsync({
      id,
      name: form.name,
      price: form.price,
      description: form.description,
      categoryId: form.categoryId || undefined,
      isAvailable: form.isAvailable,
      ingredients: form.ingredients.filter(i => i.inventoryItemId),
      image: form.imageFile ?? undefined,
    });
    setEditing(false);
  };

  const findIngMeta = (invId?: string) =>
    ingredientsList?.find((x: any) => x.id === invId); // IngredientDTO: { id, name, unit, ... }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết món</DialogTitle>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="py-6 text-center">Đang tải…</div>
        ) : detailQuery.error ? (
          <div className="py-6 text-center text-red-500">{detailQuery.error.message}</div>
        ) : detailQuery.data && form ? (
          <div className="space-y-4">
            {/* Header: ảnh + thông tin chính */}
            <div className="flex gap-4">
              <div className="w-28 h-28 rounded-lg overflow-hidden border shrink-0 bg-muted/30 flex items-center justify-center">
                {editing ? (
    <div className="flex flex-col gap-2 items-start p-2">
      {imagePreview ? (
        // preview ảnh mới chọn
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagePreview} alt="preview" className="rounded-md object-cover w-24 h-24" />
      ) : detailQuery.data?.image ? (
        <Image src={detailQuery.data.image} alt={form.name} width={96} height={96} className="rounded-md object-cover" />
      ) : (
        <div className="text-xs text-muted-foreground">Không có ảnh</div>
      )}

      <Input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setForm((s) => (s ? { ...s, imageFile: f } : s));
          if (f) {
            const url = URL.createObjectURL(f);
            setImagePreview(url);
          } else {
            setImagePreview(null);
          }
        }}
        className="w-full"
      />
      {imagePreview && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setForm((s) => (s ? { ...s, imageFile: null } : s));
            setImagePreview(null);
          }}
        >
          Bỏ ảnh mới
        </Button>
      )}
    </div>
  ) : detailQuery.data?.image ? (
    <Image src={detailQuery.data.image} alt={form.name} width={112} height={112} className="object-cover w-28 h-28" />
  ) : (
    <div className="text-xs text-muted-foreground">Không có ảnh</div>
  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <div className="md:col-span-2">
                  <Label className="mb-1 block">Tên món</Label>
                  {editing ? (
                    <Input value={form.name} onChange={(e) => setForm(s => s ? ({ ...s, name: e.target.value }) : s)} />
                  ) : (
                    <div className="text-lg font-semibold">{detailQuery.data.name}</div>
                  )}
                </div>

                <div>
                  <Label className="mb-1 block">Danh mục</Label>
                  {editing ? (
                    <Select
                      value={form.categoryId}
                      onValueChange={(v) => setForm(s => s ? ({ ...s, categoryId: v }) : s)}
                      disabled={loadingRefs}
                    >
                      <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{detailQuery.data.category?.name ?? "—"}</div>
                  )}
                </div>

                <div>
                  <Label className="mb-1 block">Giá bán</Label>
                  {editing ? (
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm(s => s ? ({ ...s, price: Number(e.target.value) || 0 }) : s)}
                    />
                  ) : (
                    <div>{formatVND(detailQuery.data.price)}</div>
                  )}
                </div>

                <div>
                  <Label className="mb-1 block">Trạng thái</Label>
                  {editing ? (
                    <Select
                      value={form.isAvailable ? "true" : "false"}
                      onValueChange={(v) => setForm(s => s ? ({ ...s, isAvailable: v === "true" }) : s)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sẵn sàng</SelectItem>
                        <SelectItem value="false">Tạm ẩn</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{detailQuery.data.isAvailable ? "Sẵn sàng" : "Tạm ẩn"}</div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label className="mb-1 block">Mô tả</Label>
                  {editing ? (
                    <Input value={form.description} onChange={(e) => setForm(s => s ? ({ ...s, description: e.target.value }) : s)} />
                  ) : (
                    <div>{detailQuery.data.description ?? "—"}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="font-medium mb-2">Nguyên liệu</div>
              {editing ? (
                <div className="space-y-2">
                  {form.ingredients.map((it, idx) => {
                    const meta = findIngMeta(it.inventoryItemId);
                    return (
                      <div key={idx} className="grid grid-cols-[1fr_140px_1fr_80px] gap-2">
                        <Select
                          value={it.inventoryItemId}
                          onValueChange={(v) => {
                            const arr = [...form.ingredients];
                            arr[idx] = { ...arr[idx], inventoryItemId: v };
                            setForm(s => s ? ({ ...s, ingredients: arr }) : s);
                          }}
                          disabled={ingLoading}
                        >
                          <SelectTrigger><SelectValue placeholder="Chọn nguyên liệu" /></SelectTrigger>
                          <SelectContent>
                            {(ingredientsList ?? []).map((m: any) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}{m.unit ? ` (${m.unit})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          placeholder="Số lượng"
                          value={it.quantity}
                          onChange={(e) => {
                            const arr = [...form.ingredients];
                            arr[idx] = { ...arr[idx], quantity: Number(e.target.value) || 0 };
                            setForm(s => s ? ({ ...s, ingredients: arr }) : s);
                          }}
                        />

                        <Input
                          placeholder="Ghi chú"
                          value={it.note ?? ""}
                          onChange={(e) => {
                            const arr = [...form.ingredients];
                            arr[idx] = { ...arr[idx], note: e.target.value };
                            setForm(s => s ? ({ ...s, ingredients: arr }) : s);
                          }}
                        />

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setForm(s => s ? ({ ...s, ingredients: s.ingredients.filter((_, i) => i !== idx) }) : s)}
                        >
                          Xóa
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    variant="secondary"
                    onClick={() => setForm(s => s ? ({ ...s, ingredients: [...s.ingredients, { inventoryItemId: "", quantity: 1 }] }) : s)}
                  >
                    + Thêm dòng
                  </Button>
                </div>
              ) : (
                <>
                  {detailQuery.data.ingredients.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Không có nguyên liệu</div>
                  ) : (
                    <ul className="list-disc pl-6 text-sm space-y-1">
                      {detailQuery.data.ingredients.map((ing) => {
                        // ưu tiên tên từ BE; nếu không có thì tra theo danh sách ingredientsList
                        const meta = ing.inventoryItem?.name
                          ? { name: ing.inventoryItem.name, unit: ing.inventoryItem.unit }
                          : findIngMeta((ing as any).inventoryItemId);
                        const label = meta?.name ? meta.name : "—";
                        const unit = meta?.unit ? ` ${meta.unit}` : "";
                        return (
                          <li key={ing.id}>
                            {label} — SL: {ing.quantity}{unit}
                            {ing.note ? ` — ${ing.note}` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Combo (nếu có) */}
            {detailQuery.data.isCombo && (
              <div>
                <div className="font-medium mb-2">Thành phần combo</div>
                {detailQuery.data.components && detailQuery.data.components.length > 0 ? (
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    {detailQuery.data.components.map((c: any) => (
                      <li key={c.id}>
                        {c.item?.name ?? "—"} — SL: {c.quantity}{c.note ? ` — ${c.note}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">Không có thành phần</div>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              {!editing ? (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
                  <Button onClick={() => setEditing(true)} disabled={busy || loadingRefs}>Sửa</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>Hủy</Button>
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
