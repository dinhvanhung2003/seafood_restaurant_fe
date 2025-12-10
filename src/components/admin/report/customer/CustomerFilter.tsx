"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export function CustomerFilter({
  date,
  setDate,
  customerQ,
  setCustomerQ,
}: {
  date: DateRange | undefined;
  setDate: (v: DateRange | undefined) => void;
  customerQ: string;
  setCustomerQ: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Date range */}
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
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="p-0 z-50 shadow-md border bg-white rounded-md w-[540px] overflow-visible"
        >
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

      {/* Customer search */}
      <div className="flex items-center border rounded-md px-2 h-9 w-[260px] bg-white">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          className="ml-2 flex-1 outline-none text-sm bg-transparent"
          placeholder="Tìm khách (mã / tên / điện thoại)"
          value={customerQ}
          onChange={(e) => setCustomerQ(e.target.value)}
        />
      </div>

      {/* Mode removed: always invoices */}
    </div>
  );
}

export default CustomerFilter;
