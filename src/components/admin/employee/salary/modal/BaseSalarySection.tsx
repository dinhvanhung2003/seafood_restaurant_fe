"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SalaryType } from "@/hooks/admin/useSalarySetting";

type Props = {
  salaryType?: SalaryType;
  baseAmount: string;
  overtimeRate: string;
  onSalaryTypeChange: (t: SalaryType) => void;
  onBaseAmountChange: (v: string) => void;
  onOvertimeChange: (v: string) => void;
};

export function BaseSalarySection({
  salaryType,
  baseAmount,
  overtimeRate,
  onSalaryTypeChange,
  onBaseAmountChange,
  onOvertimeChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Loại lương */}
      <div className="space-y-1">
        <Label>Loại lương</Label>
        <Select
          value={salaryType}
          onValueChange={(v) => onSalaryTypeChange(v as SalaryType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn loại lương" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXED">Cố định / kỳ lương</SelectItem>
            <SelectItem value="PER_SHIFT">Theo ca làm việc</SelectItem>
            <SelectItem value="PER_HOUR">Theo giờ làm việc</SelectItem>
            <SelectItem value="PER_STANDARD_DAY">Theo ngày công chuẩn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mức lương */}
      <div className="space-y-1">
        <Label>Mức lương</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={baseAmount}
            onChange={(e) => onBaseAmountChange(e.target.value)}
            placeholder="Nhập số tiền"
          />
          <span className="text-sm text-muted-foreground">
            {salaryType === "PER_SHIFT"
              ? "/ ca"
              : salaryType === "PER_HOUR"
              ? "/ giờ"
              : salaryType === "PER_STANDARD_DAY"
              ? "/ ngày công chuẩn"
              : "/ kỳ lương"}
          </span>
        </div>
      </div>

      {/* OT */}
      <div className="space-y-1 md:col-span-2 lg:col-span-1">
        <Label>Lương làm thêm giờ (OT) / giờ</Label>
        <Input
          type="number"
          min={0}
          value={overtimeRate}
          onChange={(e) => onOvertimeChange(e.target.value)}
          placeholder="0"
        />
      </div>
    </div>
  );
}
