"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Shift, ShiftPayload } from "@/hooks/admin/useShift";

/* helper: tính số giờ giữa 2 time HH:MM (qua ngày cũng được) */
function hoursBetween(a: string, b: string) {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  let m1 = ah * 60 + am;
  let m2 = bh * 60 + bm;
  if (m2 < m1) m2 += 24 * 60; // qua ngày
  return +( (m2 - m1) / 60 ).toFixed(1);
}

export default function ShiftDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<Shift>;
  onSubmit: (data: ShiftPayload) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [startTime, setStart] = useState(initial?.startTime ?? "07:00");
  const [endTime, setEnd] = useState(initial?.endTime ?? "11:00");
  const [checkInFrom, setInFrom] = useState(initial?.checkInFrom ?? "04:00");
  const [checkInTo, setInTo] = useState(initial?.checkInTo ?? "14:00");
  const [isActive, setActive] = useState(initial?.isActive ?? true);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setStart(initial?.startTime ?? "07:00");
    setEnd(initial?.endTime ?? "11:00");
    setInFrom(initial?.checkInFrom ?? "04:00");
    setInTo(initial?.checkInTo ?? "14:00");
    setActive(initial?.isActive ?? true);
  }, [open, initial]);

  const duration = useMemo(() => hoursBetween(startTime, endTime), [startTime, endTime]);

  const canSave = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Sửa ca làm việc" : "Thêm ca làm việc"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label>Tên</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ca sáng" />
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr_auto] items-end gap-3">
            <div>
              <Label>Giờ làm việc</Label>
              <Input type="time" value={startTime} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="pb-2 text-center text-sm text-muted-foreground">Đến</div>
            <div>
              <Label className="opacity-0">.</Label>
              <Input type="time" value={endTime} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="pb-2 text-right">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-sm">{duration}h</span>
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div>
              <Label>Giờ cho phép chấm công</Label>
              <Input type="time" value={checkInFrom} onChange={(e) => setInFrom(e.target.value)} />
            </div>
            <div className="pb-2 text-center text-sm text-muted-foreground">Đến</div>
            <div>
              <Label className="opacity-0">.</Label>
              <Input type="time" value={checkInTo} onChange={(e) => setInTo(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setActive} />
            <span>Đang dùng</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bỏ qua</Button>
          <Button
            disabled={!canSave}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                startTime,
                endTime,
                checkInFrom,
                checkInTo,
                isActive,
                color: initial?.color ?? null, // nếu có dùng màu
              })
            }
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
