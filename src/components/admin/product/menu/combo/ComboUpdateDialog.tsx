"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useComboDetailQuery,
  useUpdateComboMutation,
  ComboComponent,
} from "@/hooks/admin/useCombo";
import ComboComponentsBuilder, { ComboRow } from "./ComboComponentsBuilder";

export default function ComboUpdateDialog({
  id,
  open,
  onOpenChange,
  onUpdated,
}: {
  id?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated?: () => void;
}) {
  const detail = useComboDetailQuery(id);
  const update = useUpdateComboMutation();

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [desc, setDesc] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // builder rows
  const [rows, setRows] = useState<ComboRow[]>([]);
  // có cập nhật thành phần không (nếu tắt -> không gửi "components" về BE)
  const [updateComponents, setUpdateComponents] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // hydrate từ API
  useEffect(() => {
    if (detail.data) {
      setName(detail.data.name);
      setPrice(Number(detail.data.price));
      setDesc(detail.data.description ?? "");
      setIsAvailable(detail.data.isAvailable);
      setRows(
        (detail.data.components || []).map((c) => ({
          itemId: c.item.id,
          quantity: Number(c.quantity) || 1,
        }))
      );
    }
  }, [detail.data]);

  const validate = () => {
    if (!name.trim()) return "Vui lòng nhập tên combo";
    if (price <= 0) return "Giá combo phải > 0";
    if (updateComponents) {
      const ids = rows.map((r) => r.itemId).filter(Boolean) as string[];
      if (ids.length === 0) return "Vui lòng chọn ít nhất 1 món thành phần";
      if (ids.length !== new Set(ids).size) return "Danh sách thành phần có món trùng";
      if (rows.some((r) => !r.itemId || !r.quantity || r.quantity <= 0)) return "Thiếu món hoặc số lượng không hợp lệ";
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Cập nhật combo</DialogTitle>
        </DialogHeader>

        {detail.isLoading ? (
          <div className="py-6 text-center">Đang tải…</div>
        ) : detail.error ? (
          <div className="py-6 text-center text-red-500">{detail.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Tên</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <Label>Giá combo</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
              <span>Sẵn sàng</span>
            </div>

            {/* Toggle cập nhật components */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Cập nhật thành phần</Label>
                <div className="text-xs text-muted-foreground">
                  Bật để thay thế toàn bộ thành phần combo hiện tại.
                </div>
              </div>
              <Switch checked={updateComponents} onCheckedChange={setUpdateComponents} />
            </div>

            {updateComponents && (
              <div>
                <Label>Thành phần</Label>
                <ComboComponentsBuilder rows={rows} onChange={setRows} />
              </div>
            )}

            <div>
              <Label>Ảnh (tuỳ chọn)</Label>
              <Input type="file" ref={fileRef} accept="image/*" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            onClick={() => {
              if (!id) return;
              const err = validate();
              if (err) return alert(err);

              const file = fileRef.current?.files?.[0]; // optional
              let components: ComboComponent[] | undefined = undefined;

              if (updateComponents) {
                components = rows.map((r) => ({
                  itemId: r.itemId!, // đã validate
                  quantity: Number(r.quantity),
                }));
              }

              update.mutate(
                {
                  id,
                  data: {
                    name,
                    comboPrice: price,
                    description: desc,
                    isAvailable,
                    components, // chỉ gửi khi bật "Cập nhật thành phần"
                    image: file,
                  },
                },
                {
                  onSuccess: () => {
                    onUpdated?.();
                    onOpenChange(false);
                  },
                }
              );
            }}
            disabled={update.isPending || detail.isLoading}
          >
            {update.isPending ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
