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
import { toast } from "sonner";

import { useCreateOtherParty } from "@/hooks/admin/useCashBook";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export function OtherPartyCreateModal({ open, onOpenChange }: Props) {
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    address: "",
    ward: "",
    district: "",
    province: "",
    note: "",
  });

  const createOther = useCreateOtherParty();

  const onSave = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên đối tác");
      return;
    }
    const created = await createOther.mutateAsync(form);
    toast.success("Tạo đối tác khác thành công");

    // reset form & đóng
    setForm({
      name: "",
      phone: "",
      address: "",
      ward: "",
      district: "",
      province: "",
      note: "",
    });
    onOpenChange(false);

    // Gợi ý: có thể truyền callback từ modal cha để auto-select created.id
    // if (onCreated) onCreated(created?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm đối tác khác</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid gap-1">
            <Label>Tên đối tác</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-1">
            <Label>Số điện thoại</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>

          <div className="grid gap-1">
            <Label>Địa chỉ</Label>
            <Input
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-1">
              <Label>Phường/Xã</Label>
              <Input
                value={form.ward}
                onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Quận/Huyện</Label>
              <Input
                value={form.district}
                onChange={(e) =>
                  setForm((f) => ({ ...f, district: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1">
              <Label>Tỉnh/TP</Label>
              <Input
                value={form.province}
                onChange={(e) =>
                  setForm((f) => ({ ...f, province: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-1">
            <Label>Ghi chú</Label>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSave} disabled={createOther.isPending}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
