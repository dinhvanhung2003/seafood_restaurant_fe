"use client";
import React from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCashTypes } from "@/hooks/admin/useCashBook";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function CashbookFilters({
  onApply,
}: {
  onApply: (p: Record<string, any>) => void;
}) {
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<string | undefined>();
  const [counterpartyGroup, setCounterpartyGroup] = React.useState<
    string | undefined
  >();
  const [cashTypeId, setCashTypeId] = React.useState<string | undefined>();
  // removed isPostedToBusinessResult filter
  const [range, setRange] = React.useState<DateRange | undefined>();

  const { data: cashTypes = [], isLoading: isCashTypesLoading } =
    useCashTypes();

  const buildParams = () => {
    const normalized: Record<string, any> = {};
    if (q?.trim()) normalized.q = q.trim();
    if (type && type !== "__all") normalized.type = type;
    if (counterpartyGroup && counterpartyGroup !== "__all")
      normalized.counterpartyGroup = counterpartyGroup;
    if (cashTypeId && cashTypeId !== "__all" && cashTypeId !== "__loading")
      normalized.cashTypeId = cashTypeId;
    // isPostedToBusinessResult removed — do not include in params
    if (range?.from) normalized.dateFrom = format(range.from, "yyyy-MM-dd");
    if (range?.to) normalized.dateTo = format(range.to, "yyyy-MM-dd");
    normalized.page = 1;
    normalized.limit = 10;
    normalized.sortBy = "date";
    normalized.sortDir = "DESC";

    return normalized;
  };

  // apply() was removed: we auto-apply using debounce in useEffect

  const clear = () => {
    setQ("");
    setType(undefined);
    setCounterpartyGroup(undefined);
    setCashTypeId(undefined);
    setRange(undefined);
    // Call onApply with default params so that UI refreshes immediately
    onApply({ page: 1, limit: 10, sortBy: "date", sortDir: "DESC" });
  };

  // Debounce & auto-apply filters when they change
  const firstRun = React.useRef(true);
  React.useEffect(() => {
    // skip first run to avoid duplicate request on mount
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = setTimeout(() => {
      onApply(buildParams());
    }, 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, counterpartyGroup, cashTypeId, range]);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bộ lọc Sổ quỹ</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-3">
          <Label>Từ khóa</Label>
          <Input
            placeholder="Mã phiếu, nguồn..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onApply(buildParams());
              }
            }}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Loại chứng từ</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tất cả</SelectItem>
              <SelectItem value="RECEIPT">Phiếu thu</SelectItem>
              <SelectItem value="PAYMENT">Phiếu chi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Nhóm đối tác</Label>
          <Select
            value={counterpartyGroup}
            onValueChange={setCounterpartyGroup}
          >
            <SelectTrigger>
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tất cả</SelectItem>
              <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
              <SelectItem value="SUPPLIER">Nhà cung cấp</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Loại quỹ</Label>
          <Select value={cashTypeId} onValueChange={setCashTypeId}>
            <SelectTrigger>
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tất cả</SelectItem>
              {isCashTypesLoading ? (
                <SelectItem value="__loading" disabled>
                  Đang tải…
                </SelectItem>
              ) : (
                cashTypes.map((ct: any) => (
                  <SelectItem key={ct.id} value={ct.id}>
                    {ct.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        {/* Hạch toán KQKD filter removed */}
        <div className="md:col-span-3">
          <Label>Khoảng ngày</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarIcon className="h-4 w-4" />
                {range?.from ? (
                  range.to ? (
                    <span>
                      {format(range.from, "dd/MM/yyyy")} -{" "}
                      {format(range.to, "dd/MM/yyyy")}
                    </span>
                  ) : (
                    <span>{format(range.from, "dd/MM/yyyy")}</span>
                  )
                ) : (
                  <span>Chọn khoảng ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="md:col-span-12 flex items-end gap-2">
          <Button variant="secondary" onClick={clear}>
            Xóa lọc
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
