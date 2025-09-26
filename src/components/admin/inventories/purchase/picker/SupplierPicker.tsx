"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useSuppliers } from "@/hooks/admin/useSupplier";

export default function SupplierPicker({ supplierId, setSupplierId, onOpenAddSupplier }: {
  supplierId?: string;
  setSupplierId: (id: string | undefined) => void;
  onOpenAddSupplier: (v: boolean) => void;
}) {
  const [supplierSearch, setSupplierSearch] = useState("");
  const suppliersQuery = useSuppliers(1, 20, { q: supplierSearch as any, status: "ACTIVE" } as any);
  const supplierItems = suppliersQuery.data?.items ?? [];
  const selectedSupplier = useMemo(() => supplierItems.find((s) => s.id === supplierId), [supplierId, supplierItems]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Chọn nhà cung cấp</CardTitle>
        <Button onClick={() => onOpenAddSupplier(true)}>+ Thêm NCC</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Nhập để tìm NCC (tên/SĐT/mã)…"
          value={supplierSearch}
          onChange={(e) => {
            setSupplierSearch(e.target.value);
            setSupplierId(undefined);
          }}
        />
        <div className="text-xs text-slate-500">Gõ để hiển thị kết quả bên dưới</div>

        <ScrollArea className="h-[320px] rounded-md border">
          {suppliersQuery.isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">Đang tải…</div>
          ) : (supplierItems.length ?? 0) === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Không có kết quả</div>
          ) : (
            <ul className="divide-y">
              {supplierItems.map((s) => (
                <li
                  key={s.id}
                  onClick={() => setSupplierId(s.id)}
                  className={`px-3 py-2 cursor-pointer hover:bg-slate-50 ${supplierId === s.id ? "bg-blue-50" : ""}`}
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.phone ?? s.code ?? "-"}</div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {selectedSupplier ? (
          <div className="text-xs text-slate-600">
            Đã chọn: <b>{selectedSupplier.name}</b>
          </div>
        ) : (
          <div className="text-xs text-amber-700">Chưa chọn NCC</div>
        )}
      </CardContent>
    </Card>
  );
}
