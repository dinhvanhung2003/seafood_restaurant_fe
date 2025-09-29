// src/components/admin/inventories/purchase/lines/UomSelect.tsx
"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo } from "react";
import { useItemUOMs } from "@/hooks/admin/useUom.ts";

export default function UomSelect({
  itemId,
  value,
  onChange,
  disabled,
}: {
  itemId?: string;
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const { data, isLoading } = useItemUOMs(itemId);

  // tìm base để hiển thị hệ số cho các UOM khác
  const base = useMemo(() => (data ?? []).find((u) => u.isBase), [data]);

  // khi lần đầu có data mà chưa có value -> auto chọn base
  useEffect(() => {
    if (!value && data && data.length) {
      const b = data.find((u) => u.isBase) ?? data[0];
      onChange(b.code);
    }
  }, [data]);

  // dựng nhãn hiển thị: "KG — Kilogram (x1000 G)" / "G — Gram (chuẩn)"
  const makeLabel = (u: any) => {
    if (!u) return "";
    if (u.isBase) return `${u.code} — ${u.name} (chuẩn)`;
    const baseCode = base?.code ?? "";
    return `${u.code} — ${u.name} (x${u.conversionToBase} ${baseCode})`;
  };

  // text hiển thị cho SelectValue
  const selectedText = useMemo(() => {
    const cur = (data ?? []).find((u) => u.code === value);
    return makeLabel(cur);
  }, [value, data, base]);

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || !itemId || isLoading}
    >
      <SelectTrigger className="w-[180px]">
        {" "}
        {/* rộng hơn để đủ chữ */}
        <SelectValue placeholder={isLoading ? "Đang tải ĐV…" : "Chọn ĐV"}>
          {selectedText}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(data ?? []).map((u) => (
          <SelectItem key={u.code} value={u.code}>
            {makeLabel(u)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
