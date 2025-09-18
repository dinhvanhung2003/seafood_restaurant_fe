"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { useSupplierGroups } from "@/hooks/admin/useSupplierGroup";
import type { SupplierGroup } from "@/hooks/admin/useSupplierGroup";

type Props = {
  group: SupplierGroup | null;
  open: boolean;                          // ✅ controlled
  onOpenChange: (v: boolean) => void;     // ✅ controlled
  disabled?: boolean;
  onUpdated?: (g: SupplierGroup) => void;
  onDeactivated?: (id: string) => void;
};

export default function EditSupplierGroupModal({
  group,
  open,
  onOpenChange,
  disabled,
  onUpdated,
  onDeactivated,
}: Props) {
  const { updateGroup, deactivateGroup, updateStatus, deactivateStatus } =
    useSupplierGroups({ limit: 100 });

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  // Khi mở modal hoặc đổi group -> nạp dữ liệu vào form
  useEffect(() => {
    if (open && group) {
      setName(group.name ?? "");
      setDesc(group.description ?? "");
    }
  }, [open, group]);

  const submit = async () => {
    if (!group) return;
    const updated = (await updateGroup({
      id: group.id,
      data: {
        name: name.trim(),
        description: desc || undefined,
        status: group.status,
      },
    })) as SupplierGroup;
    onUpdated?.(updated);
    onOpenChange(false);
  };

  const deactivate = async () => {
    if (!group) return;
    if (!confirm("Ngừng hoạt động nhóm này?")) return;
    await deactivateGroup(group.id);
    onDeactivated?.(group.id);
    onOpenChange(false);
  };

  // Nếu lỡ được mở mà chưa có group -> hiển thị thông báo nhẹ
  if (!group) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết nhóm</DialogTitle>
          </DialogHeader>
          <div>Không tìm thấy dữ liệu</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        // tránh autofocus làm đóng popover cha
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Sửa nhóm nhà cung cấp</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Tên nhóm</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="desc">Ghi chú</Label>
            <Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 justify-between">
          <Button
            variant="destructive"
            onClick={deactivate}
            disabled={disabled || deactivateStatus.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deactivateStatus.isPending ? "Đang xử lý…" : "Xóa / Ngừng"}
          </Button>
          <div className="space-x-2">
            <Button onClick={submit} disabled={!name.trim() || updateStatus.isPending}>
              {updateStatus.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
