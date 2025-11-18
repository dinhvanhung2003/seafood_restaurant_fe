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
  open: boolean; // ✅ controlled
  onOpenChange: (v: boolean) => void; // ✅ controlled
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
  const {
    updateGroup,
    deactivateGroup,
    removeGroup,
    updateStatus,
    deactivateStatus,
    removeStatus,
  } = useSupplierGroups({ limit: 10 });

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

  // Toggle hoạt động / ngừng hoạt động
  const toggleActive = async () => {
    if (!group) return;
    // Nếu đang ACTIVE -> hỏi và gọi API ngừng hoạt động
    if (group.status === "ACTIVE") {
      if (!confirm("Ngừng hoạt động nhóm này?")) return;
      await deactivateGroup(group.id);
      onDeactivated?.(group.id);
      onOpenChange(false);
      return;
    }
    // Nếu đang INACTIVE -> kích hoạt lại bằng update status
    const updated = (await updateGroup({
      id: group.id,
      data: { status: "ACTIVE" },
    })) as SupplierGroup;
    onUpdated?.(updated);
    onOpenChange(false);
  };

  const remove = async () => {
    if (!group) return;
    if (
      !confirm(
        "Bạn chắc chắn muốn XOÁ nhóm này? Nếu nhóm có NCC đã phát sinh giao dịch sẽ không xoá được."
      )
    )
      return;
    try {
      await removeGroup(group.id);
      onDeactivated?.(group.id); // reuse callback to refresh selection
      onOpenChange(false);
    } catch (e: any) {
      const code = e?.response?.data?.message;
      if (
        code ===
        "GROUP_HAS_SUPPLIERS_WITH_TRANSACTIONS_DEACTIVATION_RECOMMENDED"
      ) {
        // offer quick deactivate fallback
        if (confirm("Không xoá được. Ngừng hoạt động thay thế?")) {
          await deactivateGroup(group.id);
          onDeactivated?.(group.id);
          onOpenChange(false);
        }
      }
    }
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
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="desc">Ghi chú</Label>
            <Textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="destructive"
              onClick={remove}
              disabled={
                disabled || removeStatus.isPending || deactivateStatus.isPending
              }
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {removeStatus.isPending ? "Đang xoá…" : "Xoá nhóm"}
            </Button>
            <Button
              variant="outline"
              onClick={toggleActive}
              disabled={
                disabled ||
                deactivateStatus.isPending ||
                removeStatus.isPending ||
                updateStatus.isPending
              }
            >
              {group.status === "ACTIVE"
                ? deactivateStatus.isPending
                  ? "Đang xử lý…"
                  : "Ngừng hoạt động"
                : updateStatus.isPending
                ? "Đang kích hoạt…"
                : "Hoạt động lại"}
            </Button>
          </div>
          <div className="space-x-2 self-end sm:self-auto">
            <Button
              onClick={submit}
              disabled={!name.trim() || updateStatus.isPending}
            >
              {updateStatus.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
