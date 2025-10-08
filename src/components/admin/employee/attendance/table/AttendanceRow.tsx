// FragmentRow.tsx
import Cell from "./AttendanceCell";
import type { Attendance, Employee, Shift } from "@/hooks/admin/useAttendance";

type Props = {
  shift: Shift;
  days: Date[];
  cellMap: Map<string, Attendance[]>;
  assignedMap: Map<string, Employee[]>; // key = `${dateISO}::${shiftId}`
  onNew: (dateISO: string, shift: Shift) => void;
  onNewForEmployee: (dateISO: string, shift: Shift, empId: string) => void; // ← NEW
  fmtISO: (d: Date) => string;
};

export default function FragmentRow({
  shift, days, cellMap, assignedMap, onNew, onNewForEmployee, fmtISO,
}: Props) {
  return (
    <>
      <div className="p-3 border-b font-medium">
        {shift.name}
        <div className="text-xs text-muted-foreground">
          {shift.startTime} – {shift.endTime}
        </div>
      </div>

      {days.map((d, i) => {
        const dateISO  = fmtISO(d);
        const key      = `${dateISO}::${shift.id}`;
        const assigned = assignedMap.get(key) || [];
        return (
          <Cell
            key={i}
            dateISO={dateISO}
            shift={shift}
            cellMap={cellMap}
            assignedEmployees={assigned}
            onNew={onNew}
            onNewForEmployee={onNewForEmployee}  // ← NEW
          />
        );
      })}
    </>
  );
}
