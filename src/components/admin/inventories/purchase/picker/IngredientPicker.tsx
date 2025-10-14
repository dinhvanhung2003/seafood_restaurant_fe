"use client";
import { useEffect, useMemo, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIngredients } from "@/hooks/admin/useIngredients";

type IngOption = {
  value: string;
  label: string;
  unit?: string | null;
  quantity?: number;
};

export default function IngredientPicker({
  onAdd,
  onOpenAddIngredient,
}: {
  onAdd: (id: string, name: string, unit?: string) => void;
  onOpenAddIngredient: (v: boolean) => void;
}) {
  const { data = [], isFetching } = useIngredients();

  // input người dùng đang gõ + debounce 300ms
  const [input, setInput] = useState("");
  const [kw, setKw] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setKw(input.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [input]);

  // lọc theo keyword
  const filtered = useMemo(
    () =>
      !kw
        ? data
        : data.filter(
            (i: any) =>
              i.name?.toLowerCase().includes(kw) ||
              i.unit?.toLowerCase?.().includes(kw)
          ),
    [data, kw]
  );

  const options: IngOption[] = useMemo(
    () =>
      filtered.map((i: any) => ({
        value: i.id,
        label: i.name,
        unit: i.unit,
        quantity: i.quantity,
      })),
    [filtered]
  );

  const styles: StylesConfig<IngOption, false> = {
    control: (b, s) => ({
      ...b,
      minHeight: 40,
      borderRadius: 8,
      borderColor: s.isFocused ? "hsl(221,83%,53%)" : "hsl(214,32%,91%)",
      boxShadow: s.isFocused ? "0 0 0 2px hsl(221 83% 53% / .2)" : "none",
    }),
    menu: (b) => ({ ...b, zIndex: 40 }),
  };

  const formatOptionLabel = (opt: IngOption) => (
    <div className="flex items-center justify-between gap-3">
      <div className="font-medium">{opt.label}</div>
      <div className="text-xs text-slate-500 shrink-0">
        ĐV: {opt.unit ?? "—"} · Tồn: {opt.quantity ?? 0}
      </div>
    </div>
  );

  const handleChange = (opt: SingleValue<IngOption>) => {
    if (opt) {
      onAdd(opt.value, opt.label, opt.unit ?? undefined);
      // sau khi chọn thì clear input để lần sau tìm mới
      setInput("");
    }
  };

  const handleInputChange = (val: string, meta: any) => {
    if (meta.action === "input-change") setInput(val);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Chọn nguyên liệu</CardTitle>
        <Button variant="outline" onClick={() => onOpenAddIngredient(true)}>
          + Thêm nguyên liệu
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <Select<IngOption, false>
          placeholder="Nhập tên / đơn vị để tìm…"
          value={null}              // luôn ở trạng thái search-picker
          options={options}
          onChange={handleChange}
          onInputChange={handleInputChange}
          isLoading={isFetching}
          // đã tự lọc phía trên => tránh filter 2 lần
          filterOption={() => true}
          formatOptionLabel={formatOptionLabel}
          styles={styles}
          isClearable
        />

        {/* Quick add */}
        <div className="text-sm text-slate-600">
          <div className="mb-2 font-medium">Thêm nhanh:</div>
          <div className="flex flex-wrap gap-2">
            {data.slice(0, 10).map((it: any) => (
              <Badge
                key={it.id}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onAdd(it.id, it.name, it.unit)}
              >
                + {it.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
