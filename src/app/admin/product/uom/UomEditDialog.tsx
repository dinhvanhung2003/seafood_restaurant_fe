"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUomMutation } from "@/hooks/admin/useUnitsOfMeasure";
import type { UnitOfMeasure } from "@/types/admin/product/uom";
import { useAppToast } from "@/lib/toast";
import { Pencil, Save } from "lucide-react";

const DIMENSIONS = [
  { value: "count", label: "Số lượng (count)" },
  { value: "mass", label: "Khối lượng (mass)" },
  { value: "volume", label: "Thể tích (volume)" },
] as const;

type Props = { uom: UnitOfMeasure; onUpdated?: () => void };

export function UomEditDialog({ uom, onUpdated }: Props) {
  const toast = useAppToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(uom.name);
  const [dimension, setDimension] = useState<UnitOfMeasure["dimension"]>(
    uom.dimension
  );
  const [submitting, setSubmitting] = useState(false);

  const updateMut = useUpdateUomMutation({
    onError: (e) => toast.error("Cập nhật thất bại", (e as Error)?.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tên không được để trống");
      return;
    }
    setSubmitting(true);
    updateMut.mutate(
      { args: { code: uom.code }, data: { name: name.trim(), dimension } },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật đơn vị tính");
          setOpen(false);
          onUpdated?.();
        },
        onSettled: () => setSubmitting(false),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          // reset form mỗi khi mở
          setName(uom.name);
          setDimension(uom.dimension);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Chỉnh sửa">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đơn vị</DialogTitle>
          <DialogDescription>
            Mã đơn vị <span className="font-mono">{uom.code}</span> không thể
            thay đổi. Bạn có thể cập nhật tên và quy cách đo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Mã</Label>
            <Input value={uom.code} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Tên</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên hiển thị"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quy cách đo</Label>
            <Select
              value={dimension}
              onValueChange={(v) => setDimension(v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIMENSIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              <Save className="h-4 w-4 mr-2" /> Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
