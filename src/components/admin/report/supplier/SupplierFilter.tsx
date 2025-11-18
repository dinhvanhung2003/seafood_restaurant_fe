"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

// Chế độ hiển thị: Phiếu nhập | Phiếu trả | Ròng NCC
type Mode = "purchase" | "return" | "net";

interface Props {
  date: DateRange | undefined;
  setDate: (d: DateRange | undefined) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  supplierQ: string;
  setSupplierQ: (q: string) => void;
  loading: boolean;
  onFetch: () => void;
}

export function SupplierFilter({
  date,
  setDate,
  mode,
  setMode,
  supplierQ,
  setSupplierQ,
  loading,
  onFetch,
}: Props) {
  React.useEffect(() => {
    const t = setTimeout(() => onFetch(), 300);
    return () => clearTimeout(t);
  }, [
    date?.from?.toISOString?.(),
    date?.to?.toISOString?.(),
    mode,
    supplierQ,
    onFetch,
  ]);

  const today = () => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    setDate({ from: start, to: start });
  };
  const last7 = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    setDate({ from: start, to: end });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from
              ? date.to
                ? `${format(date.from, "dd/MM/yyyy", {
                    locale: vi,
                  })} - ${format(date.to, "dd/MM/yyyy", { locale: vi })}`
                : format(date.from, "dd/MM/yyyy", { locale: vi })
              : "Chọn ngày"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 w-auto z-[60]">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={today}>
          Hôm nay
        </Button>
        <Button variant="secondary" size="sm" onClick={last7}>
          7 ngày
        </Button>
      </div>

      <Input
        placeholder="Tìm NCC (mã, tên, sđt)"
        value={supplierQ}
        onChange={(e) => setSupplierQ(e.target.value)}
        className="w-56"
      />

      {/* Bỏ chọn số top (tự cố định Top 10 cho biểu đồ) */}

      <RadioGroup
        className="flex gap-5 rounded-md border px-4 py-2 bg-white shadow-sm"
        value={mode}
        onValueChange={(v) => setMode(v as Mode)}
      >
        <label className="flex items-center gap-2 text-sm font-medium">
          <RadioGroupItem value="purchase" />
          <span>Phiếu nhập</span>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <RadioGroupItem value="return" />
          <span>Phiếu trả</span>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <RadioGroupItem value="net" />
          <span>Ròng NCC</span>
        </label>
      </RadioGroup>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent" />{" "}
          Đang tải...
        </div>
      )}
    </div>
  );
}

export default SupplierFilter;
