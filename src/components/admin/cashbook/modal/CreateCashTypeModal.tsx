"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

import { useCreateCashType } from "@/hooks/admin/useCashBook";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export function CreateCashTypeModal({ open, onOpenChange }: Props) {
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    isIncomeType: true,
    isActive: true,
  });

  const createType = useCreateCashType();

  const onSave = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên loại");
      return;
    }
    await createType.mutateAsync(form);
    toast.success("Thêm loại thu/chi thành công");
    onOpenChange(false);
    setForm({ name: "", description: "", isIncomeType: true, isActive: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm loại thu/chi</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid gap-1">
            <Label>Tên loại</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-1">
            <Label>Mô tả</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Là loại thu?</Label>
            <Switch
              checked={form.isIncomeType}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, isIncomeType: v }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSave} disabled={createType.isPending}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
