// src/features/attendance/components/Legend.tsx
"use client";
export type Shift = {
  id: string;
  name: string;
  color?: string | null;
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
};

export type Employee = {
  id: string;
  fullName: string;
  code?: string | null;
};

export type AttendanceStatus = "ON_TIME" | "LATE" | "MISSING" | "ABSENT" | "LEAVE";

export type Attendance = {
  id: string;
  userId: string;
  dateISO: string;     // YYYY-MM-DD
  shiftId: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  note?: string | null;
  user?: Employee;
  shift?: Shift;
};

export const STATUS_UI: Record<
  AttendanceStatus,
  { text: string; className: string }
> = {
  ON_TIME: { text: "Đúng giờ", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  LATE:    { text: "Đi muộn / về sớm", className: "bg-violet-100 text-violet-700 border-violet-200" },
  MISSING: { text: "Chấm thiếu", className: "bg-rose-100 text-rose-700 border-rose-200" },
  ABSENT:  { text: "Nghỉ không phép", className: "bg-neutral-200 text-neutral-700 border-neutral-300" },
  LEAVE:   { text: "Nghỉ làm", className: "bg-slate-100 text-slate-700 border-slate-200" },
};
import { cn } from "@/lib/utils";

export default function Legend() {
  const items = ["ON_TIME","LATE","MISSING","LEAVE","ABSENT"] as AttendanceStatus[];
  return (
    <div className="flex items-center gap-2 text-sm">
      {items.map(s => (
        <span key={s} className={cn("px-2 py-1 rounded border", STATUS_UI[s].className)}>
          {STATUS_UI[s].text}
        </span>
      ))}
    </div>
  );
}
