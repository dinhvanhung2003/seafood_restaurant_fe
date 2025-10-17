"use client";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import MenuItemCombobox from "./MenuItemCombobox";

export type ComboRow = { itemId?: string; quantity: number };

export default function ComboComponentsBuilder({
  rows,
  onChange,
}: {
  rows: ComboRow[];
  onChange: (next: ComboRow[]) => void;
}) {
  const addRow = () => onChange([...rows, { itemId: undefined, quantity: 1 }]);
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  const setRow = (idx: number, patch: Partial<ComboRow>) =>
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const invalid = useMemo(() => {
    const ids = rows.map((r) => r.itemId).filter(Boolean) as string[];
    const duplicates = new Set(ids.filter((id, i) => ids.indexOf(id) !== i));
    return { hasEmpty: rows.some((r) => !r.itemId || !r.quantity), duplicates };
  }, [rows]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 font-medium text-sm text-muted-foreground">
        <div className="col-span-8">Món</div>
        <div className="col-span-3">Số lượng</div>
        <div className="col-span-1" />
      </div>

      {rows.map((r, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-8">
            <MenuItemCombobox
              value={r.itemId}
              onChange={(id) => setRow(idx, { itemId: id })}
              placeholder="Chọn món…"
            />
            {/* cảnh báo trùng */}
            {r.itemId && rows.filter((x) => x.itemId === r.itemId).length > 1 && (
              <div className="text-xs text-amber-600 mt-1">Món này đang bị trùng trong danh sách.</div>
            )}
          </div>
          <div className="col-span-3">
            <Input
              type="number"
              min={1}
              value={r.quantity}
              onChange={(e) => setRow(idx, { quantity: Math.max(1, Number(e.target.value)) })}
            />
          </div>
          <div className="col-span-1">
            <Button variant="outline" size="icon" onClick={() => removeRow(idx)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={addRow}>+ Thêm thành phần</Button>
        {rows.length === 0 && <span className="text-xs text-muted-foreground">Chưa có thành phần nào.</span>}
      </div>

      {/* Tóm tắt lỗi nhỏ */}
      <div className="text-xs text-muted-foreground">
        {invalid.hasEmpty && <div>Vui lòng chọn món và nhập số lượng cho tất cả dòng.</div>}
        {rows.length > 0 && invalid.duplicates.size > 0 && <div>Đang có món trùng lặp.</div>}
      </div>
    </div>
  );
}
