"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useShiftsQuery, useCreateShiftMutation, type ShiftPayload } from "@/hooks/admin/useShift";
import { useEmployee } from "@/hooks/admin/useEmployee";
import { useCreateSchedule } from "@/hooks/admin/useSchedule";

// 👇 import dialog tạo/sửa ca
import ShiftDialog from "@/components/admin/employee/work-schedule/shift/modal/ShiftDialog";

export default function AddScheduleDialog({
  open, onOpenChange, userId, date,
}: { open: boolean; onOpenChange: (v: boolean) => void; userId?: string; date?: string; }) {
  const { data: shiftsRes, isLoading: shiftsLoading, error: shiftsError } = useShiftsQuery();
  const shifts = shiftsRes?.data ?? [];
  const { rows: employees } = useEmployee(1,10,"");
  const create = useCreateSchedule();

  // state chọn ca & options
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [repeatWeekly, setRepeat] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState<string>("");
  const [applyOthers, setApplyOthers] = useState(false);
  const [otherUserIds, setOtherUserIds] = useState<Record<string, boolean>>({});

  // 👇 state mở dialog tạo ca
  const [openCreateShift, setOpenCreateShift] = useState(false);
  const createShift = useCreateShiftMutation();

  // reset khi đóng
  useMemo(() => {
    if (!open) {
      setPicked({});
      setRepeat(false);
      setRepeatUntil("");
      setApplyOthers(false);
      setOtherUserIds({});
      setOpenCreateShift(false);
    }
  }, [open]);

  const selectedShiftIds = Object.entries(picked).filter(([, v]) => v).map(([id]) => id);
  const selectedOtherIds = Object.entries(otherUserIds).filter(([, v]) => v).map(([id]) => id);

  // tạo ca mới từ dialog con
  const handleCreateShift = (payload: ShiftPayload) => {
    createShift.mutate(payload, {
      onSuccess: (res: any) => {
        // tự tick ca vừa tạo
        const newId = res?.data?.id ?? res?.id;
        if (newId) setPicked(p => ({ ...p, [newId]: true }));
        setOpenCreateShift(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm lịch làm việc</DialogTitle>
        </DialogHeader>

        {!userId || !date ? (
          <div className="py-6 text-center text-muted-foreground">Chưa chọn nhân viên hoặc ngày</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Nhân viên:</span>{" "}
                {employees.find(e => e.id === userId)?.fullName || userId}
                {" · "}
                <span className="font-medium">Ngày:</span>{" "}
                {new Date(date).toLocaleDateString("vi-VN")}
              </div>

              {/* 👇 nút tạo ca ngay trong modal */}
              <Button size="sm" onClick={() => setOpenCreateShift(true)}>
                + Tạo ca
              </Button>
            </div>

            {/* danh sách ca */}
            <div className="space-y-2">
              <div className="font-medium">Chọn ca làm việc</div>

              {shiftsLoading ? (
                <div className="text-sm text-muted-foreground">Đang tải danh sách ca…</div>
              ) : shiftsError ? (
                <div className="text-sm text-red-500">Không tải được danh sách ca</div>
              ) : shifts.length === 0 ? (
                <div className="rounded-md border p-3 text-sm">
                  Chưa có ca nào. Bấm <button className="underline text-blue-600" onClick={() => setOpenCreateShift(true)}>Tạo ca</button>.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-2">
                  {shifts.map(s => (
                    <label key={s.id} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                      <Checkbox
                        checked={!!picked[s.id]}
                        onCheckedChange={(v) => setPicked(p => ({ ...p, [s.id]: Boolean(v) }))}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.startTime} - {s.endTime}
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: s.color || "#e5e7eb" }} />
                    </label>
                  ))}
                </div>
              )}

              {selectedShiftIds.length === 0 && shifts.length > 0 && !shiftsLoading && (
                <div className="text-xs text-red-500">Hãy chọn ít nhất 1 ca</div>
              )}
            </div>

            {/* lặp tuần */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={repeatWeekly} onCheckedChange={setRepeat} />
                <span className="font-medium">Lặp lại hằng tuần</span>
              </div>
              {repeatWeekly && (
                <div className="flex items-center gap-2">
                  <Label className="w-28">Đến ngày</Label>
                  <Input type="date" value={repeatUntil} onChange={(e) => setRepeatUntil(e.target.value)} />
                </div>
              )}
            </div>

            {/* áp dụng cho NV khác */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={applyOthers} onCheckedChange={setApplyOthers} />
                <span className="font-medium">Thêm lịch tương tự cho nhân viên khác</span>
              </div>
              {applyOthers && (
                <div className="grid md:grid-cols-3 gap-2 max-h-40 overflow-auto border rounded p-2">
                  {employees.filter(e => e.id !== userId).map(e => (
                    <label key={e.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={!!otherUserIds[e.id]}
                        onCheckedChange={(v) => setOtherUserIds(p => ({ ...p, [e.id]: Boolean(v) }))}
                      />
                      <span>{e.fullName || e.email}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bỏ qua</Button>
          <Button
            onClick={() => {
              if (!userId || !date || selectedShiftIds.length === 0) return;
              const applyIds = applyOthers ? selectedOtherIds : undefined;
              selectedShiftIds.forEach(shiftId => {
                create.mutate({
                  userId,
                  date,
                  shiftId,
                  repeatWeekly,
                  repeatUntil: repeatWeekly && repeatUntil ? repeatUntil : undefined,
                  applyToUserIds: applyIds,
                });
              });
              onOpenChange(false);
            }}
            disabled={!userId || !date || selectedShiftIds.length === 0 || create.isPending}
          >
            {create.isPending ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* ===== Dialog tạo ca lồng trong modal lịch ===== */}
      <ShiftDialog
        open={openCreateShift}
        onOpenChange={setOpenCreateShift}
        onSubmit={handleCreateShift}
      />
    </Dialog>
  );
}
