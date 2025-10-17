'use client';

import React from 'react';
import { format } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
}

/**
 * DateRange Picker đơn giản dùng react-day-picker
 */
export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const footer =
    value?.from && value?.to
      ? `Chọn từ ${format(value.from, 'dd/MM/yyyy')} đến ${format(value.to, 'dd/MM/yyyy')}`
      : 'Chọn ngày bắt đầu và kết thúc.';

  return (
    <div className={className}>
      <DayPicker
        mode="range"
        selected={value}
        onSelect={onChange}
        footer={<div className="mt-2 text-sm text-muted-foreground">{footer}</div>}
      />
    </div>
  );
}

export default DatePicker;
