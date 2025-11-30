"use client";

import { useUom } from "@/hooks/admin/useUom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UomPickerProps {
  inventoryItemId: string;
  baseUnit?: string; // Add baseUnit prop
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function UomPicker({
  inventoryItemId,
  baseUnit, // Destructure baseUnit
  value,
  onChange,
  disabled,
}: UomPickerProps) {
  const { data: uoms, isLoading } = useUom(inventoryItemId);

  const hasUoms = uoms && uoms.length > 0;

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || isLoading || !hasUoms}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn ĐV"} />
      </SelectTrigger>
      <SelectContent>
        {hasUoms ? (
          uoms.map((uom) => {
            const factorNum = Number(uom.factor);
            const showConversion =
              Number.isFinite(factorNum) && factorNum !== 1 && !!baseUnit;
            return (
              <SelectItem key={uom.code} value={uom.code}>
                {uom.name}
                {showConversion
                  ? ` (1 ${uom.code} = ${factorNum} ${baseUnit})`
                  : ""}
              </SelectItem>
            );
          })
        ) : (
          <SelectItem value="-" disabled>
            Không có ĐV
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
