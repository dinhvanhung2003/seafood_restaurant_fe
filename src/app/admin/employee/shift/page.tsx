"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployee } from "@/hooks/admin/useEmployee";
import { useWeekSchedules } from "@/hooks/admin/useSchedule";
import ScheduleCell from "@/components/admin/employee/work-schedule/table/ScheduleCell";

/* helpers */
function startOfWeek(d: Date) {
  const x = new Date(d);
  const dow = x.getDay();            // 0..6 (0=CN)
  const delta = (dow + 6) % 7;       // 0->thứ2, ..., 6->CN
  x.setDate(x.getDate() - delta);
  x.setHours(0, 0, 0, 0);
  return x;
}
function formatISO(d: Date) { return d.toISOString().slice(0,10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function viDayLabel(idx: number) {
  return ["Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy","Chủ nhật"][idx];
}

export default function WorkSchedulePage() {
  // tuần hiện tại
  const [anchor, setAnchor] = useState<Date>(startOfWeek(new Date())); // Thứ 2
  const weekDays = useMemo(() => Array.from({length:7},(_,i)=>addDays(anchor,i)), [anchor]);
  const start = formatISO(weekDays[0]);
  const end   = formatISO(weekDays[6]);

  // nhân viên
  const { rows: employees, isLoading: empLoading } = useEmployee();

  // lịch trong tuần
  const { data: items = [], isLoading } = useWeekSchedules(start, end);

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Lịch làm việc</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAnchor(addDays(anchor, -7))}>◀ Tuần trước</Button>
          <div className="min-w-[220px]">
            <Input
              type="week"
              onChange={(e) => {
                const v = e.target.value; // "YYYY-W##"
                if (!v) return;
                const [y, w] = v.split("-W").map(Number);
                const jan4 = new Date(Date.UTC(y,0,4));
                const day = jan4.getUTCDay() || 7;
                const isoMonday = new Date(jan4);
                isoMonday.setUTCDate(jan4.getUTCDate() - day + 1 + (w-1)*7);
                setAnchor(startOfWeek(new Date(isoMonday)));
              }}
              placeholder="Chọn tuần"
            />
          </div>
          <Button variant="outline" onClick={() => setAnchor(startOfWeek(new Date()))}>Tuần này</Button>
          <Button variant="outline" onClick={() => setAnchor(addDays(anchor, 7))}>Tuần sau ▶</Button>
        </div>
      </div>

      {/* grid */}
      <Card className="hidden lg:block">
  <Table>
    <TableHeader>
      <TableRow className="bg-slate-50">
        <TableHead className="w-[220px]">Nhân viên</TableHead>
        {weekDays.map((d, i) => (
          <TableHead key={i} className="text-center">
            <div className="font-medium">{viDayLabel(i)}</div>
            <div className="text-xs text-muted-foreground">
              {d.toLocaleDateString("vi-VN")}
            </div>
          </TableHead>
        ))}
        <TableHead className="w-[140px] text-right">Lương dự kiến</TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      {empLoading ? (
        <TableRow>
          <TableCell colSpan={9} className="py-10 text-center">
            Đang tải nhân viên…
          </TableCell>
        </TableRow>
      ) : employees.length === 0 ? (
        <TableRow>
          <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
            Chưa có nhân viên
          </TableCell>
        </TableRow>
      ) : (
        employees.map((emp) => (
          <TableRow key={emp.id} className="align-top">
            <TableCell>
              <div className="font-medium">{emp.fullName || emp.username || emp.email}</div>
              <div className="text-xs text-muted-foreground">{emp.id.slice(0,8).toUpperCase()}</div>
            </TableCell>

            {weekDays.map((d, idx) => {
              const iso = formatISO(d);
              const cells = items.filter(x => x.user.id === emp.id && x.date === iso);
              const chips = cells.map(it => ({
                id: it.id, name: it.shift.name, color: it.shift.color,
                startTime: it.shift.startTime, endTime: it.shift.endTime,
              }));
              return (
                <TableCell key={idx} className="p-0">
                  {isLoading && chips.length === 0 ? (
                    <div className="min-h-[72px] grid place-items-center text-xs text-muted-foreground">
                      Đang tải…
                    </div>
                  ) : (
                    <ScheduleCell userId={emp.id} dateISO={iso} shifts={chips} />
                  )}
                </TableCell>
              );
            })}

            <TableCell className="text-right align-top">
              <div className="font-medium">—</div>
              <div className="text-xs text-muted-foreground">chưa tính</div>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</Card>

{/* MOBILE/TABLET (< lg): thẻ theo nhân viên, 7 ngày xếp dạng grid 2 cột */}
<div className="space-y-3 lg:hidden">
  {empLoading ? (
    <Card className="p-6 text-center">Đang tải nhân viên…</Card>
  ) : employees.length === 0 ? (
    <Card className="p-6 text-center text-muted-foreground">Chưa có nhân viên</Card>
  ) : (
    employees.map((emp) => (
      <Card key={emp.id} className="p-4">
        <div className="mb-3">
          <div className="font-medium">{emp.fullName || emp.username || emp.email}</div>
          <div className="text-xs text-muted-foreground">
            {emp.id.slice(0,8).toUpperCase()}
          </div>
        </div>

        {/* 7 ngày – responsive grid: 1 cột trên xs, 2 cột trên sm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {weekDays.map((d, i) => {
            const iso = formatISO(d);
            const cells = items.filter(x => x.user.id === emp.id && x.date === iso);
            const chips = cells.map(it => ({
              id: it.id, name: it.shift.name, color: it.shift.color,
              startTime: it.shift.startTime, endTime: it.shift.endTime,
            }));

            return (
              <div key={i} className="rounded-lg border p-3">
                <div className="mb-2">
                  <div className="text-sm font-medium">{viDayLabel(i)}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.toLocaleDateString("vi-VN")}
                  </div>
                </div>

                {isLoading && chips.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Đang tải…</div>
                ) : (
                  <ScheduleCell userId={emp.id} dateISO={iso} shifts={chips} />
                )}
              </div>
            );
          })}
        </div>

        {/* lương dự kiến (nếu muốn) */}
        <div className="mt-3 text-right text-sm text-muted-foreground">Lương dự kiến: —</div>
      </Card>
    ))
  )}
</div>
    </div>
  );
}
