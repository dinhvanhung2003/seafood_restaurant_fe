// AttendanceModal.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpsertAttendanceMutation } from "@/hooks/admin/useAttendance";
import type { Attendance, Employee, Shift } from "@/hooks/admin/useAttendance";

type Props = {
  open: boolean;
  onClose: () => void;
  payload: {
    dateISO: string;
    shift: Shift;
    employees: Employee[];      // nhân viên đã phân ca
    existing?: Attendance[];    // bản ghi đã có (nếu muốn hiển thị/khai thác)
  };
  onSaved: () => void;
  preselectEmpId?: string | null; // ← NEW
};

export default function AttendanceModal({
  open, onClose, payload, onSaved, preselectEmpId,
}: Props) {
  const [empId, setEmpId] = useState<string>("");
  const [mode, setMode] = useState<"WORK" | "LEAVE" | "ABSENT">("WORK");
  const [checkIn, setCheckIn]   = useState(payload.shift.startTime);
  const [checkOut, setCheckOut] = useState(payload.shift.endTime);
  const [note, setNote] = useState("");

  // Ưu tiên chọn người được truyền sẵn
  useEffect(() => {
    const first = payload.employees[0]?.id ?? "";
    setEmpId(preselectEmpId || first);
  }, [payload.employees, preselectEmpId]);

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
    else { body.checkIn = checkIn; body.checkOut = checkOut; }

    await m.mutateAsync(body);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Chấm công • {payload.shift.name} • {payload.dateISO}</DialogTitle>
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
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
            {payload.employees.length === 0 && (
              <p className="mt-1 text-xs text-rose-600">Chưa có nhân viên nào được phân ca này.</p>
            )}
          </div>

          <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="work" value="WORK" /><Label htmlFor="work">Đi làm</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="leave" value="LEAVE" /><Label htmlFor="leave">Nghỉ có phép</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="abs" value="ABSENT" /><Label htmlFor="abs">Nghỉ không phép</Label>
            </div>
          </RadioGroup>

          {mode === "WORK" && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Giờ vào</Label><Input type="time" value={checkIn}  onChange={(e)=>setCheckIn(e.target.value)} /></div>
              <div><Label>Giờ ra</Label><Input  type="time" value={checkOut} onChange={(e)=>setCheckOut(e.target.value)} /></div>
            </div>
          )}

          <div>
            <Label>Ghi chú</Label>
            <Input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Ghi chú (không bắt buộc)" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Bỏ qua</Button>
          <Button onClick={save} disabled={!empId || m.isPending}>
            {m.isPending ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
