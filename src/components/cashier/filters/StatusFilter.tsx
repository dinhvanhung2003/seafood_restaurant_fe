"use client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Props = {
  value: "all" | "using" | "empty";
  onChange: (v: "all" | "using" | "empty") => void;
  counts: { all: number; using: number; empty: number };
};

export function StatusFilter({ value, onChange, counts }: Props) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as Props["value"])} className="flex items-center gap-4">
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <RadioGroupItem value="all" />
        <span>Tất cả ({counts.all})</span>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <RadioGroupItem value="using" />
        <span>Sử dụng ({counts.using})</span>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <RadioGroupItem value="empty" />        {/* ← "empty" */}
        <span>Còn trống ({counts.empty})</span>
      </label>
    </RadioGroup>
  );
}
