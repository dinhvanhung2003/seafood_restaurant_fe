"use client";
import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateComboMutation } from "@/hooks/admin/useCombo";
import ComboComponentsBuilder, { ComboRow } from "./ComboComponentsBuilder";

export default function ComboCreateDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: () => void; }) {
  const create = useCreateComboMutation();
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [desc, setDesc] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [rows, setRows] = useState<ComboRow[]>([{ itemId: undefined, quantity: 1 }]);
  const fileRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    if (!name.trim()) return "Vui lòng nhập tên combo";
    if (price <= 0) return "Giá combo phải > 0";
    if (!fileRef.current?.files?.[0]) return "Vui lòng chọn ảnh";
    const ids = rows.map(r => r.itemId).filter(Boolean) as string[];
    if (ids.length === 0) return "Vui lòng chọn ít nhất 1 món thành phần";
    if (ids.length !== new Set(ids).size) return "Danh sách thành phần có món trùng";
    if (rows.some(r => !r.itemId || !r.quantity || r.quantity <= 0)) return "Thiếu món hoặc số lượng không hợp lệ";
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Tạo combo</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tên</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Giá combo</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            <span>Sẵn sàng</span>
          </div>

          <div>
            <Label>Thành phần</Label>
            <ComboComponentsBuilder rows={rows} onChange={setRows} />
          </div>

          <div>
            <Label>Ảnh</Label>
            <Input type="file" ref={fileRef} accept="image/*" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button
            onClick={() => {
              const err = validate();
              if (err) return alert(err);
              const file = fileRef.current!.files![0];
              const components = rows.map(r => ({ itemId: r.itemId!, quantity: Number(r.quantity) }));
              create.mutate(
                { name, comboPrice: price, description: desc, isAvailable, components, image: file },
                { onSuccess: () => { onCreated?.(); onOpenChange(false); } }
              );
            }}
            disabled={create.isPending}
          >
            {create.isPending ? "Đang tạo…" : "Tạo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
