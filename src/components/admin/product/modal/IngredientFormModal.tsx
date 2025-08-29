"use client";

import { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  minQty?: number;
  qty: number;
  active: boolean;
};

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  form: Omit<Ingredient, "id">;
  setForm: Dispatch<SetStateAction<Omit<Ingredient, "id">>>;
  onSubmit: () => void;
  title?: string;
};

export default function IngredientFormModal({
  open, setOpen, form, setForm, onSubmit, title = "Tạo nguyên liệu",
}: Props) {
  const units = ["Chai", "Kg", "Bát", "Đĩa", "Cốc"];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[90vw] !max-w-[600px]">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1 block">Tên nguyên liệu *</Label>
            <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <Label className="mb-1 block">Đơn vị</Label>
            <Input list="unit-list" value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} />
            <datalist id="unit-list">
              {units.map((u) => <option key={u} value={u} />)}
            </datalist>
          </div>
          <div>
            <Label className="mb-1 block">Số lượng tồn</Label>
            <Input type="number" value={form.qty} onChange={(e) => setForm((s) => ({ ...s, qty: Number(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label className="mb-1 block">SL tối thiểu</Label>
            <Input type="number" value={form.minQty ?? 0} onChange={(e) => setForm((s) => ({ ...s, minQty: Number(e.target.value) || 0 }))} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => setOpen(false)}>Bỏ qua</Button>
          <Button onClick={onSubmit}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
