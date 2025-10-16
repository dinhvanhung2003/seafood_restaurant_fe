"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export type Channel = "DINEIN" | "DELIVERY" | "TAKEAWAY" | "ALL";
export type PaymentMethod = "CASH" | "CARD" | "MOMO" | "BANK" | "ALL";

export interface ReportFilterProps {
  date: DateRange | undefined;
  setDate: Dispatch<SetStateAction<DateRange | undefined>>;

  channel: Channel;
  setChannel: Dispatch<SetStateAction<Channel>>;

  paymentMethod?: PaymentMethod;
  setPaymentMethod: Dispatch<SetStateAction<PaymentMethod | undefined>>;

  /** Gọi API tạo report */
  fetchReport: () => void | Promise<void>;
  loading: boolean;
}

export function ReportFilter({
  date,
  setDate,
  channel,
  setChannel,
  paymentMethod,
  setPaymentMethod,
  fetchReport,
  loading,
}: ReportFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Date range */}
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

      {/* Channel */}
      <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Kênh bán" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả kênh</SelectItem>
          <SelectItem value="DINEIN">Tại chỗ</SelectItem>
          <SelectItem value="DELIVERY">Giao hàng</SelectItem>
          <SelectItem value="TAKEAWAY">Mang đi</SelectItem>
        </SelectContent>
      </Select>

      {/* Payment method */}
      <Select
        value={paymentMethod ?? "ALL"}
        onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
      >
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="PT thanh toán" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả</SelectItem>
          <SelectItem value="CASH">Tiền mặt</SelectItem>
          <SelectItem value="CARD">Thẻ</SelectItem>
          <SelectItem value="MOMO">Momo</SelectItem>
          <SelectItem value="BANK">Chuyển khoản</SelectItem>
        </SelectContent>
      </Select>

      {/* (tuỳ chọn) hiển thị số liệu theo Doanh thu / Số lượng */}
      <RadioGroup className="flex space-x-4" defaultValue="revenue">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="revenue" id="revenue" />
          <label htmlFor="revenue">Doanh thu</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="items" id="items" />
          <label htmlFor="items">Hàng bán</label>
        </div>
      </RadioGroup>

      {/* Action */}
      <Button onClick={fetchReport} disabled={loading}>
        {loading ? "Đang tải..." : "Xem báo cáo"}
      </Button>
    </div>
  );
}
