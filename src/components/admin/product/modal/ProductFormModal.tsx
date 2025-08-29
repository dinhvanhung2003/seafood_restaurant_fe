"use client";

import { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Category } from "@/components/admin/product/filter/ProductFilter";
import type { Ingredient } from "./IngredientFormModal";

export type ProductFormState = {
  id?: string;
  code?: string;
  name: string;
  categoryId: string;
  unit: string;
  price: number;
  cost: number;
  status: "active" | "inactive";
  // tồn kho trực tiếp
  trackInventory: boolean;
  stockQty?: number;
  // công thức
  stockMode: "product" | "ingredients" | "none";
  recipe: Array<{ ingredientId: string; qty: number }>;
  note?: string;
};

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  form: ProductFormState;
  setForm: Dispatch<SetStateAction<ProductFormState>>;
  onSubmit: () => void;
  categories: Category[];
  ingredients: Ingredient[];
  onCreateIngredient: () => void; // mở modal tạo nguyên liệu
  editing: boolean;
};

export default function ProductFormModal({
  open, setOpen, form, setForm, onSubmit, categories, ingredients, onCreateIngredient, editing,
}: Props) {
  const units = ["Chai", "Kg", "Bát", "Đĩa", "Cốc"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[92vw] !max-w-[880px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Cập nhật hàng hóa" : "Thêm hàng hóa"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="mb-1 block">Mã hàng hóa</Label>
            <Input value={form.code ?? ""} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label className="mb-1 block">Tên hàng hóa *</Label>
            <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </div>

          <div>
            <Label className="mb-1 block">Danh mục</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm((s) => ({ ...s, categoryId: v }))}>
              <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1 block">Đơn vị</Label>
            <Input list="unit-list2" value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} />
            <datalist id="unit-list2">{units.map((u) => <option key={u} value={u} />)}</datalist>
          </div>

          <div>
            <Label className="mb-1 block">Giá vốn</Label>
            <Input type="number" value={form.cost} onChange={(e) => setForm((s) => ({ ...s, cost: Number(e.target.value) || 0 }))} />
          </div>

          <div>
            <Label className="mb-1 block">Giá bán</Label>
            <Input type="number" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value) || 0 }))} />
          </div>

          <div className="md:col-span-3">
            <Label className="mb-2 block">Trạng thái</Label>
            <RadioGroup
              className="flex gap-6"
              value={form.status}
              onValueChange={(v) => setForm((s) => ({ ...s, status: v as any }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="p1" value="active" />
                <Label htmlFor="p1">Đang kinh doanh</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="p2" value="inactive" />
                <Label htmlFor="p2">Ngừng kinh doanh</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Liên kết kho */}
          <div className="md:col-span-3 rounded-lg border p-4">
            <div className="font-medium mb-2">Liên kết kho hàng</div>
            <RadioGroup
              className="flex flex-wrap gap-6"
              value={form.stockMode}
              onValueChange={(v) => setForm((s) => ({ ...s, stockMode: v as any }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="m0" value="none" />
                <Label htmlFor="m0">Không quản lý tồn</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="m1" value="product" />
                <Label htmlFor="m1">Quản lý hàng tồn (theo SL mặt hàng)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="m2" value="ingredients" />
                <Label htmlFor="m2">Quản lý nguyên liệu</Label>
              </div>
            </RadioGroup>

            {form.stockMode === "product" && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-1 block">Tồn kho</Label>
                  <Input
                    type="number"
                    value={form.stockQty ?? 0}
                    onChange={(e) => setForm((s) => ({ ...s, stockQty: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            )}

            {form.stockMode === "ingredients" && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Công thức (nguyên liệu)</div>
                  <Button size="sm" variant="outline" onClick={onCreateIngredient}>
                    + Thêm nguyên liệu mới
                  </Button>
                </div>

                <div className="space-y-2">
                  {form.recipe.map((r, idx) => {
                    const ing = ingredients.find((x) => x.id === r.ingredientId);
                    return (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_140px_80px] gap-2">
                        <Select
                          value={r.ingredientId}
                          onValueChange={(v) => {
                            const recipe = [...form.recipe];
                            recipe[idx] = { ...recipe[idx], ingredientId: v };
                            setForm((s) => ({ ...s, recipe }));
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Chọn nguyên liệu" /></SelectTrigger>
                          <SelectContent>
                            {ingredients.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} ({m.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          value={r.qty}
                          onChange={(e) => {
                            const recipe = [...form.recipe];
                            recipe[idx] = { ...recipe[idx], qty: Number(e.target.value) || 0 };
                            setForm((s) => ({ ...s, recipe }));
                          }}
                          placeholder="Số lượng"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setForm((s) => ({ ...s, recipe: s.recipe.filter((_, i) => i !== idx) }))}
                        >
                          Xóa
                        </Button>
                      </div>
                    );
                  })}

                  <Button
                    variant="secondary"
                    onClick={() => setForm((s) => ({ ...s, recipe: [...s.recipe, { ingredientId: "", qty: 1 }] }))}
                  >
                    + Thêm dòng
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => setOpen(false)}>Bỏ qua</Button>
          <Button onClick={onSubmit}>{editing ? "Lưu thay đổi" : "Lưu & Thêm mới"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
