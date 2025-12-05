"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  useAttendanceRangeQuery,
  useEmployeesQuery,
  useShiftsQuery,
  useUpsertAttendanceMutation,
  useWeekSchedulesQuery,
  STATUS_UI,
  type Attendance,
  type Employee,
  type Shift,
} from "@/hooks/admin/useAttendance";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/* ───────── helpers (LOCAL time, không UTC) ───────── */
function startOfWeek(d: Date) {
  const x = new Date(d);
  const dow = x.getDay(); // 0=CN
  const delta = (dow + 6) % 7; // về Thứ 2
  x.setDate(x.getDate() - delta);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
// YYYY-MM-DD theo local
function formatYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const viDay = [
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
  "Chủ nhật",
];

/* ───────── Modal: Chấm công ───────── */
function AttendanceModal({
  open,
  onClose,
  payload,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  payload: {
    dateISO: string;
    shift: Shift;
    employees: Employee[];
    existing?: Attendance[];
    presetEmpId?: string;
  };
  onSaved: () => void;
}) {
  const [empId, setEmpId] = useState<string>(
    payload.presetEmpId ?? payload.employees[0]?.id ?? "",
  );
  const [mode, setMode] = useState<"WORK" | "LEAVE" | "ABSENT">("WORK");
  const [checkIn, setCheckIn] = useState(payload.shift.startTime);
  const [checkOut, setCheckOut] = useState(payload.shift.endTime);
  const [note, setNote] = useState("");

  useEffect(() => {
    setEmpId(payload.presetEmpId ?? payload.employees[0]?.id ?? "");
  }, [payload.employees, payload.presetEmpId]);

  const m = useUpsertAttendanceMutation(payload.dateISO, payload.dateISO);

  const save = async () => {
    if (!empId) return;
    const body: any = {
      userId: empId,
      dateISO: payload.dateISO,
      shiftId: payload.shift.id,
      note: note || null,
    };
    if (mode === "LEAVE" || mode === "ABSENT") body.status = mode;
    else {
      body.checkIn = checkIn;
      body.checkOut = checkOut;
    }
    await m.mutateAsync(body);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Chấm công • {payload.shift.name} • {payload.dateISO}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nhân viên</Label>
            <select
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              {payload.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </select>
            {payload.employees.length === 0 && (
              <p className="mt-1 text-xs text-rose-600">
                Chưa có nhân viên nào được phân ca này.
              </p>
            )}
          </div>

          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as any)}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="work" value="WORK" />
              <Label htmlFor="work">Đi làm</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="leave" value="LEAVE" />
              <Label htmlFor="leave">Nghỉ có phép</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="abs" value="ABSENT" />
              <Label htmlFor="abs">Nghỉ không phép</Label>
            </div>
          </RadioGroup>

          {mode === "WORK" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Giờ vào</Label>
                <Input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div>
                <Label>Giờ ra</Label>
                <Input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <Label>Ghi chú</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú (không bắt buộc)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Bỏ qua
          </Button>
          <Button onClick={save} disabled={!empId || m.isPending}>
            {m.isPending ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────── Cell ───────── */
function Cell({
  dateISO,
  shift,
  cellMap,
  assignedEmployees,
  onNew,
}: {
  dateISO: string;
  shift: Shift;
  cellMap: Map<string, Attendance[]>;
  assignedEmployees: Employee[];
  onNew: (dateISO: string, shift: Shift, presetEmpId?: string) => void;
}) {
  const key = `${dateISO}::${shift.id}`;
  const list = cellMap.get(key) || [];

  const byUser = new Map<string, Attendance>();
  for (const a of list) byUser.set(a.userId, a);

  if (assignedEmployees.length === 0) {
    return (
      <div className="min-h-[92px] border-b border-l p-2">
        <Badge variant="secondary" className="text-xs">
          Chưa phân ca
        </Badge>
      </div>
    );
  }

  return (
    <div className="min-h-[92px] border-b border-l p-2">
      <div className="flex flex-wrap gap-2">
        {assignedEmployees.map((e) => {
          const a = byUser.get(e.id);
          const className = a
            ? STATUS_UI[a.status].className
            : "bg-slate-100 text-slate-700 border-slate-200";

          return (
            <button
              key={e.id}
              onClick={() => onNew(dateISO, shift, e.id)}
              className={cn(
                "rounded border px-2 py-1 text-xs transition hover:opacity-90",
                className,
              )}
              title={a?.note || ""}
            >
              <span className="font-medium">{e.fullName}</span>
              {a && (a.status === "ON_TIME" || a.status === "LATE") ? (
                <span className="ml-1 opacity-80">
                  ({a.checkIn ?? "--"}–{a.checkOut ?? "--"})
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── FragmentRow ───────── */
function FragmentRow({
  shift,
  days,
  cellMap,
  assignedMap,
  onNew,
  filterEmployees,
}: {
  shift: Shift;
  days: Date[];
  cellMap: Map<string, Attendance[]>;
  assignedMap: Map<string, Employee[]>;
  onNew: (dateISO: string, shift: Shift, presetEmpId?: string) => void;
  filterEmployees: (list: Employee[]) => Employee[];
}) {
  return (
    <>
      <div className="border-b p-3 font-medium">
        {shift.name}
        <div className="text-xs text-muted-foreground">
          {shift.startTime} – {shift.endTime}
        </div>
      </div>
      {days.map((d, i) => {
        const dateISO = formatYMD(d); /* dùng local */
        const key = `${dateISO}::${shift.id}`;
        const raw = assignedMap.get(key) || [];
        const assigned = filterEmployees(raw);

        return (
          <Cell
            key={i}
            dateISO={dateISO}
            shift={shift}
            cellMap={cellMap}
            assignedEmployees={assigned}
            onNew={onNew}
          />
        );
      })}
    </>
  );
}

/* ───────── Page ───────── */
export default function AttendanceBoardPage() {
  const [anchor, setAnchor] = useState<Date>(startOfWeek(new Date()));
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)),
    [anchor],
  );

  // range LOCAL YYYY-MM-DD
  const fromISO = formatYMD(days[0]);
  const toISO = formatYMD(days[6]);

  const { data: shifts = [] } = useShiftsQuery();
  const { data: employees = [] } = useEmployeesQuery();
  const { data: attends = [], refetch } = useAttendanceRangeQuery(
    fromISO,
    toISO,
  );
  const { data: schedules = [] } = useWeekSchedulesQuery(fromISO, toISO);

  // keyword filter nhân viên
  const [empKeyword, setEmpKeyword] = useState("");

  // map attendance (date+shift) -> Attendance[]
  const cellMap = useMemo(() => {
    const m = new Map<string, Attendance[]>();
    for (const a of attends) {
      const k = `${a.dateISO}::${a.shiftId}`;
      const list = m.get(k) || [];
      list.push(a);
      m.set(k, list);
    }
    return m;
  }, [attends]);

  // map phân ca (date+shift) -> Employee[]
  const assignedMap = useMemo(() => {
    const m = new Map<string, Employee[]>();
    for (const ws of schedules as any[]) {
      const key = `${ws.date}::${ws.shift.id}`;
      const arr = m.get(key) || [];
      const u: Employee = ws.user;
      if (!arr.some((e) => e.id === u.id)) arr.push(u);
      m.set(key, arr);
    }
    return m;
  }, [schedules]);

  // filter theo tên / mã NV
  const filterEmployees = useCallback(
    (list: Employee[]) => {
      const q = empKeyword.trim().toLowerCase();
      if (!q) return list;
      return list.filter((e) => {
        const name = e.fullName?.toLowerCase() ?? "";
        const code = e.code?.toLowerCase() ?? "";
        return name.includes(q) || code.includes(q);
      });
    },
    [empKeyword],
  );

  const [modal, setModal] = useState<null | {
    dateISO: string;
    shift: Shift;
    presetEmpId?: string;
  }>(null);

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Bảng chấm công</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAnchor(addDays(anchor, -7))}>
            ◀ Tuần trước
          </Button>
          <Button variant="outline" onClick={() => setAnchor(startOfWeek(new Date()))}>
            Tuần này
          </Button>
          <Button variant="outline" onClick={() => setAnchor(addDays(anchor, 7))}>
            Tuần sau ▶
          </Button>
        </div>
      </div>

      {/* legend + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-[320px]">
          <Input
            placeholder="Tìm nhân viên theo tên hoặc mã"
            value={empKeyword}
            onChange={(e) => setEmpKeyword(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {(
            ["ON_TIME", "LATE", "MISSING", "LEAVE", "ABSENT"] as Array<
              keyof typeof STATUS_UI
            >
          ).map((k) => (
            <span
              key={k}
              className={cn("rounded border px-2 py-1", STATUS_UI[k].className)}
            >
              {STATUS_UI[k].text}
            </span>
          ))}
        </div>
      </div>

      {/* desktop grid */}
      <Card className="hidden overflow-hidden xl:block">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `220px repeat(7, minmax(140px, 1fr))`,
          }}
        >
          <div className="border-b bg-slate-50 p-3 font-medium">
            Ca làm việc
          </div>
          {days.map((d, i) => (
            <div
              key={i}
              className="border-b bg-slate-50 p-3 text-center font-medium"
            >
              <div>{viDay[i]}</div>
              <div className="text-xs text-muted-foreground">
                {d.toLocaleDateString("vi-VN")}
              </div>
            </div>
          ))}

          {shifts.map((shift) => (
            <FragmentRow
              key={shift.id}
              shift={shift}
              days={days}
              cellMap={cellMap}
              assignedMap={assignedMap}
              onNew={(dateISO, s, presetEmpId) =>
                setModal({ dateISO, shift: s, presetEmpId })
              }
              filterEmployees={filterEmployees}
            />
          ))}
        </div>
      </Card>

      {/* mobile per-day */}
      <div className="space-y-4 md:hidden">
        {days.map((d, idx) => (
          <Card key={idx} className="p-3">
            <div className="mb-2">
              <div className="font-medium">{viDay[idx]}</div>
              <div className="text-xs text-muted-foreground">
                {d.toLocaleDateString("vi-VN")}
              </div>
            </div>
            <Separator />
            <div className="mt-3 space-y-3">
              {shifts.map((s) => {
                const dateISO = formatYMD(d); /* dùng local */
                const key = `${dateISO}::${s.id}`;
                const raw = assignedMap.get(key) || [];
                const assigned = filterEmployees(raw);
                return (
                  <div key={s.id}>
                    <div className="mb-2 font-medium">
                      {s.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {s.startTime}–{s.endTime}
                      </span>
                    </div>
                    <Cell
                      dateISO={dateISO}
                      shift={s}
                      cellMap={cellMap}
                      assignedEmployees={assigned}
                      onNew={(iso, sh, uid) =>
                        setModal({
                          dateISO: iso,
                          shift: sh,
                          presetEmpId: uid,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <AttendanceModal
          open
          onClose={() => setModal(null)}
          payload={{
            dateISO: modal.dateISO,
            shift: modal.shift,
            employees:
              assignedMap.get(`${modal.dateISO}::${modal.shift.id}`) || [],
            existing:
              cellMap.get(`${modal.dateISO}::${modal.shift.id}`) || [],
            presetEmpId: modal.presetEmpId,
          }}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
