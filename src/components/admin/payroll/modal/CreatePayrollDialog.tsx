"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreatePayroll } from "@/hooks/admin/usePayroll";
import { useEmployee } from "@/hooks/admin/useEmployee";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Scope = "ALL" | "CUSTOM";

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { from: toISO(start), to: toISO(end) };
}

export default function CreatePayrollDialog({ open, onOpenChange }: Props) {
  const { from: defaultFrom, to: defaultTo } = useMemo(
    () => getCurrentMonthRange(),
    []
  );

  const [name, setName] = useState("");
  const [payCycle, setPayCycle] = useState<"MONTHLY" | "WEEKLY">("MONTHLY");
  const [workDateFrom, setWorkDateFrom] = useState(defaultFrom);
  const [workDateTo, setWorkDateTo] = useState(defaultTo);

  const [scope, setScope] = useState<Scope>("ALL");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState("");

  // lấy list nhân viên (dùng hook sẵn có của bạn)
  const { rows: staffRows, isLoading: staffLoading } = useEmployee(
    1,
    1000,
    staffSearch
  );

  const createMutation = useCreatePayroll();

  // reset form mỗi lần mở
  useEffect(() => {
    if (!open) return;
    setName("");
    setPayCycle("MONTHLY");
    setWorkDateFrom(defaultFrom);
    setWorkDateTo(defaultTo);
    setScope("ALL");
    setSelectedStaffIds([]);
    setStaffSearch("");
  }, [open, defaultFrom, defaultTo]);

  const toggleStaff = (id: string, checked: boolean) => {
    setSelectedStaffIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleSubmit = () => {
    if (!workDateFrom || !workDateTo) {
      toast.error("Vui lòng chọn kỳ làm việc");
      return;
    }
    if (scope === "CUSTOM" && selectedStaffIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 nhân viên");
      return;
    }

    const payload = {
      name:
        name.trim() ||
        `Bảng lương tháng ${
          new Date(workDateFrom).getMonth() + 1
        }/${new Date(workDateFrom).getFullYear()}`,
      payCycle,
      workDateFrom,
      workDateTo,
      applyAllStaff: scope === "ALL",
      staffIds: scope === "CUSTOM" ? selectedStaffIds : undefined,
    };

    createMutation.mutate(payload, {
      onSuccess() {
        toast.success("Tạo bảng lương thành công");
        onOpenChange(false);
      },
      onError(err: any) {
        toast.error(err?.message || "Tạo bảng lương thất bại");
      },
    });
  };

  const isPending = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Thêm bảng tính lương</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Thông tin chung */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tên bảng lương</Label>
              <Input
                placeholder="VD: Bảng lương tháng 11/2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Kỳ hạn trả lương</Label>
              <select
                className="border rounded px-2 py-2 text-sm w-full"
                value={payCycle}
                onChange={(e) =>
                  setPayCycle(e.target.value as "MONTHLY" | "WEEKLY")
                }
              >
                <option value="MONTHLY">Hàng tháng</option>
                <option value="WEEKLY">Hàng tuần</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Kỳ làm việc từ</Label>
              <Input
                type="date"
                value={workDateFrom}
                onChange={(e) => setWorkDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Kỳ làm việc đến</Label>
              <Input
                type="date"
                value={workDateTo}
                onChange={(e) => setWorkDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Phạm vi áp dụng */}
          <div className="space-y-2">
            <Label>Phạm vi áp dụng</Label>
            <RadioGroup
              className="flex gap-6"
              value={scope}
              onValueChange={(v) => setScope(v as Scope)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ALL" id="scope-all" />
                <Label htmlFor="scope-all" className="font-normal">
                  Tất cả nhân viên
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CUSTOM" id="scope-custom" />
                <Label htmlFor="scope-custom" className="font-normal">
                  Tùy chọn nhân viên
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Danh sách nhân viên (chỉ hiện khi CUSTOM) */}
          {scope === "CUSTOM" && (
            <div className="border rounded-md">
              <div className="flex items-center justify-between px-3 py-2 border-b gap-2">
                <span className="text-sm font-medium">Chọn nhân viên</span>
                <Input
                  className="max-w-xs h-8 text-sm"
                  placeholder="Tìm theo tên, email..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
              </div>

              <ScrollArea className="max-h-64">
                {staffLoading ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    Đang tải danh sách nhân viên...
                  </div>
                ) : staffRows.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    Không có nhân viên nào.
                  </div>
                ) : (
                  <div className="divide-y">
                    {staffRows.map((s) => {
                      const id = s.id;
                      const checked = selectedStaffIds.includes(id);
                      const name = s.profile?.fullName || s.email || "Nhân viên";
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              toggleStaff(id, Boolean(c))
                            }
                          />
                          <div className="flex flex-col">
                            <span>{name}</span>
                            <span className="text-xs text-muted-foreground">
                              {s.email}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Bỏ qua
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Đang tạo..." : "Lưu"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
