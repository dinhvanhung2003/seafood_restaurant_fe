"use client";
import { useEffect, useMemo, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSuppliers } from "@/hooks/admin/useSupplier";

type Option = { value: string; label: string; phone?: string|null; code?: string|null };

export default function SupplierPicker({
  supplierId,
  setSupplierId,
  onOpenAddSupplier,
}: {
  supplierId?: string;
  setSupplierId: (id: string | undefined) => void;
  onOpenAddSupplier: (v: boolean) => void;
}) {
  // text người dùng đang gõ
  const [input, setInput] = useState("");
  // debounce 300ms
  const [kw, setKw] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setKw(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  // gọi BE – gửi cả q & search để tương thích
  const params = useMemo(
    () => ({ q: kw || undefined, search: kw || undefined, status: "ACTIVE" } as any),
    [kw]
  );
  const query = useSuppliers(1, 20, params);
  const items =
  Array.isArray((query.data as any)?.items)
    ? (query.data as any).items
    : ((query.data as any)?.data ?? []);

  const options: Option[] = useMemo(
    () => items.map((s: any) => ({ value: s.id, label: s.name, phone: s.phone, code: s.code })),
    [items]
  );

  const value = useMemo(
    () => options.find(o => o.value === supplierId) ?? null,
    [options, supplierId]
  );

  const onChange = (opt: SingleValue<Option>) => setSupplierId(opt?.value);

  const onInputChange = (val: string, meta: any) => {
    if (meta.action === "input-change") setInput(val);
  };

  const styles: StylesConfig<Option, false> = {
    control: (b, s) => ({
      ...b, minHeight: 40, borderRadius: 8,
      borderColor: s.isFocused ? "hsl(221,83%,53%)" : "hsl(214,32%,91%)",
      boxShadow: s.isFocused ? "0 0 0 2px hsl(221 83% 53% / .2)" : "none",
    }),
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Chọn nhà cung cấp</CardTitle>
        <Button onClick={() => onOpenAddSupplier(true)}>+ Thêm NCC</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select<Option, false>
          value={value}
          options={options}
          onChange={onChange}
          onInputChange={onInputChange}
          isLoading={query.isFetching}
          placeholder="Nhập tên/SĐT/mã để tìm NCC…"
          noOptionsMessage={() => (kw ? "Không có kết quả" : "Gõ để tìm nhà cung cấp")}
          // không lọc client vì đã lọc server
          filterOption={() => true}
          styles={styles}
          isClearable
        />

        {value ? (
          <div className="text-xs text-slate-600">Đã chọn: <b>{value.label}</b></div>
        ) : (
          <div className="text-xs text-amber-700">Chưa chọn NCC</div>
        )}
      </CardContent>
    </Card>
  );
}
