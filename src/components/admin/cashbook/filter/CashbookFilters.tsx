"use client";
import React from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, RefreshCcw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function CashbookFilters({ onApply }: { onApply: (p: Record<string, any>) => void }) {
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<string | undefined>();
  const [counterpartyGroup, setCounterpartyGroup] = React.useState<string | undefined>();
  const [cashTypeId, setCashTypeId] = React.useState<string | undefined>();
  const [isPostedToBusinessResult, setIsPostedToBusinessResult] = React.useState<string | undefined>();
  const [range, setRange] = React.useState<DateRange | undefined>();

  const demoCashTypes = [
    { id: "6bb07f12-ba95-4879-adda-c30fa59bfd92", name: "Thu tiền khách trả" },
    { id: "3f4ab58d-9ad1-4753-b0e6-eeed6bb9a33d", name: "Chi tiền trả NCC" },
  ];

  const apply = () => {
    onApply({
      q: q || undefined,
      type,
      counterpartyGroup,
      cashTypeId,
      isPostedToBusinessResult,
      dateFrom: range?.from?.toISOString(),
      dateTo: range?.to?.toISOString(),
      page: 1,
      limit: 15,
      sortBy: "date",
      sortDir: "DESC",
    });
  };

  const clear = () => {
    setQ("");
    setType(undefined);
    setCounterpartyGroup(undefined);
    setCashTypeId(undefined);
    setIsPostedToBusinessResult(undefined);
    setRange(undefined);
    onApply({ page: 1, limit: 15, sortBy: "date", sortDir: "DESC" });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bộ lọc Sổ quỹ</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-3">
          <Label>Từ khóa</Label>
          <Input placeholder="Mã phiếu, nguồn..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Loại chứng từ</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="RECEIPT">Phiếu thu</SelectItem>
              <SelectItem value="PAYMENT">Phiếu chi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Nhóm đối tác</Label>
          <Select value={counterpartyGroup} onValueChange={setCounterpartyGroup}>
            <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
              <SelectItem value="SUPPLIER">Nhà cung cấp</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Loại quỹ</Label>
          <Select value={cashTypeId} onValueChange={setCashTypeId}>
            <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
            <SelectContent>
              {demoCashTypes.map((ct) => (
                <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Hạch toán KQKD</Label>
          <Select value={isPostedToBusinessResult} onValueChange={setIsPostedToBusinessResult}>
            <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Đã hạch toán</SelectItem>
              <SelectItem value="false">Chưa hạch toán</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Label>Khoảng ngày</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarIcon className="h-4 w-4" />
                {range?.from ? (
                  range.to ? (
                    <span>{format(range.from, "dd/MM/yyyy")} - {format(range.to, "dd/MM/yyyy")}</span>
                  ) : (
                    <span>{format(range.from, "dd/MM/yyyy")}</span>
                  )
                ) : (
                  <span>Chọn khoảng ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="md:col-span-12 flex items-end gap-2">
          <Button onClick={apply} className="gap-1"><RefreshCcw className="h-4 w-4"/>Áp dụng</Button>
          <Button variant="secondary" onClick={clear}>Xóa lọc</Button>
        </div>
      </CardContent>
    </Card>
  );
}
