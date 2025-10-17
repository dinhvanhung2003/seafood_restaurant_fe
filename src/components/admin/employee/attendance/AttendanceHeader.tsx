// src/features/attendance/components/AttendanceHeader.tsx
"use client";
import { Button } from "@/components/ui/button";

export default function AttendanceHeader({
  onPrev, onToday, onNext,
}: { onPrev: () => void; onToday: () => void; onNext: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-2xl font-semibold">Bảng chấm công</h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPrev}>◀ Tuần trước</Button>
        <Button variant="outline" onClick={onToday}>Tuần này</Button>
        <Button variant="outline" onClick={onNext}>Tuần sau ▶</Button>
      </div>
    </div>
  );
}
