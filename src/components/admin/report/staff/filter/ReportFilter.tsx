'use client';

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface ReportFilterProps {
  date: DateRange | undefined;
  setDate: (value: DateRange | undefined) => void;
  channel: string;
  setChannel: (value: string) => void;
  mode: "revenue" | "items";
  setMode: (value: "revenue" | "items") => void;
  onFetch: () => void;          // ✅ Đổi prop này cho khớp
  loading: boolean;
}

export function ReportFilter({
  date,
  setDate,
  channel,
  setChannel,
  mode,
  setMode,
  onFetch,
  loading,
}: ReportFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* --- Date range --- */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to
                ? `${format(date.from, "dd/MM/yyyy", { locale: vi })} - ${format(date.to, "dd/MM/yyyy", { locale: vi })}`
                : format(date.from, "dd/MM/yyyy", { locale: vi })
            ) : "Chọn ngày"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
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

      {/* --- Channel select --- */}
      <Select value={channel} onValueChange={setChannel}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Kênh bán" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DINEIN">Tại chỗ</SelectItem>
          <SelectItem value="DELIVERY">Giao hàng</SelectItem>
          <SelectItem value="TAKEAWAY">Mang đi</SelectItem>
        </SelectContent>
      </Select>

      {/* --- Radio switch --- */}
      <RadioGroup className="flex space-x-4" value={mode} onValueChange={setMode}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="revenue" id="revenue" />
          <label htmlFor="revenue">Doanh thu</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="items" id="items" />
          <label htmlFor="items">Hàng bán</label>
        </div>
      </RadioGroup>

      {/* --- Button --- */}
      <Button onClick={onFetch} disabled={loading}>
        {loading ? "Đang tải..." : "Xem báo cáo"}
      </Button>
    </div>
  );
}
