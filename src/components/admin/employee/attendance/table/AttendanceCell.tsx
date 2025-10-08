// Cell.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_UI } from "@/hooks/admin/useAttendance";
import type { Attendance, Employee, Shift } from "@/hooks/admin/useAttendance";

type Props = {
  dateISO: string;
  shift: Shift;
  cellMap: Map<string, Attendance[]>;
  assignedEmployees: Employee[]; // từ Work Schedules
  onNew: (dateISO: string, shift: Shift) => void;
  onNewForEmployee?: (dateISO: string, shift: Shift, empId: string) => void; // ← NEW
};

export default function Cell({
  dateISO, shift, cellMap, assignedEmployees, onNew, onNewForEmployee,
}: Props) {
  const key   = `${dateISO}::${shift.id}`;
  const list  = cellMap.get(key) || [];
  const byUsr = new Map(list.map(a => [a.userId, a]));

  const canCreate = assignedEmployees.length > 0;

  return (
    <div className="border-b border-l p-2 min-h-[92px]">
      <div className="flex flex-wrap gap-2">
        {assignedEmployees.map(emp => {
          const a = byUsr.get(emp.id);
          if (a) {
            // ĐÃ CHẤM → chip màu theo trạng thái
            return (
              <span
                key={emp.id}
                className={cn("px-2 py-1 rounded border text-xs cursor-default", STATUS_UI[a.status].className)}
                title={a.note || ""}
              >
                {emp.fullName}
                {(a.status === "ON_TIME" || a.status === "LATE") && (
                  <span className="ml-1 opacity-80">({a.checkIn ?? "--"}–{a.checkOut ?? "--"})</span>
                )}
              </span>
            );
          }
          // CHƯA CHẤM → chip trung tính; bấm để mở modal chấm cho đúng người
          return (
            <button
              key={emp.id}
              className="px-2 py-1 rounded border text-xs hover:bg-slate-50"
              onClick={() => onNewForEmployee?.(dateISO, shift, emp.id)}
              title="Chấm công"
            >
              {emp.fullName}
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        {canCreate ? (
          <Button size="sm" variant="ghost" onClick={() => onNew(dateISO, shift)}>
            + Thêm
          </Button>
        ) : (
          <Badge variant="secondary" className="text-xs">Chưa phân ca</Badge>
        )}
      </div>
    </div>
  );
}
