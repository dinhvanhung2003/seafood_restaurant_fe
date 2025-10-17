"use client";

import { useState } from "react";
import AddScheduleDialog from "@/components/admin/employee/work-schedule/modal/AddScheduleDialog";
import { cn } from "@/lib/utils";

type ShiftChip = {
  id: string;
  name: string;
  color?: string | null;
  startTime?: string;
  endTime?: string;
};

export default function ScheduleCell({
  userId,
  dateISO,
  shifts,
  className,
}: {
  userId: string;
  dateISO: string;              // YYYY-MM-DD
  shifts: ShiftChip[];          // các ca đã có trong ô
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "relative group min-h-[84px] border-l border-b bg-white px-3 py-2",
        "hover:bg-slate-50 transition-colors",
        className
      )}
    >
      {/* các chip ca */}
      <div className="flex flex-wrap gap-2">
        {shifts.map((s) => (
          <span
            key={s.id}
            className={cn(
              "px-2 py-1 rounded-md text-xs border",
              s.color ? "text-white border-transparent" : "bg-slate-100"
            )}
            style={s.color ? { backgroundColor: s.color } : undefined}
            title={s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : ""}
          >
            {s.name}
          </span>
        ))}
      </div>

      {/* nút thêm: chỉ hiện khi hover/focus */}
      <button
        className={cn(
          "absolute left-2 bottom-2 text-xs text-blue-600 hover:underline",
          "opacity-0 pointer-events-none",
          "group-hover:opacity-100 group-hover:pointer-events-auto",
          "focus:opacity-100 focus:pointer-events-auto",
          "group-focus-within:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        + Thêm lịch
      </button>

      <AddScheduleDialog
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        date={dateISO}
      />
    </div>
  );
}
