"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIngredients } from "@/features/admin/inventory/api";

export default function IngredientPicker({ onAdd, onOpenAddIngredient }: {
  onAdd: (id: string, name: string, unit?: string) => void;
  onOpenAddIngredient: (v: boolean) => void;
}) {
  const ingQuery = useIngredients();
  const [ingSearch, setIngSearch] = useState("");
  const ingFiltered = useMemo(() => {
    const q = ingSearch.trim().toLowerCase();
    const src = ingQuery.data ?? [];
    return q ? src.filter((i) => i.name.toLowerCase().includes(q)) : src;
  }, [ingQuery.data, ingSearch]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Chọn nguyên liệu</CardTitle>
        <Button variant="outline" onClick={() => onOpenAddIngredient(true)}>+ Thêm nguyên liệu</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Nhập để tìm nguyên liệu…" value={ingSearch} onChange={(e) => setIngSearch(e.target.value)} />
        <ScrollArea className="h-[320px] rounded-md border">
          {ingQuery.isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">Đang tải…</div>
          ) : (
            <ul className="divide-y">
              {(ingFiltered ?? []).map((it) => (
                <li key={it.id} className="px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-slate-500">Đơn vị: {it.unit} • Tồn: {it.quantity}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onAdd(it.id, it.name, it.unit)}>+ Thêm</Button>
                </li>
              ))}
              {ingFiltered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">Không có kết quả</li>
              )}
            </ul>
          )}
        </ScrollArea>
        <div className="text-sm text-slate-600">
          <div className="mb-2 font-medium">Thêm nhanh:</div>
          <div className="flex flex-wrap gap-2">
            {(ingQuery.data ?? []).slice(0, 10).map((it) => (
              <Badge key={it.id} variant="secondary" className="cursor-pointer" onClick={() => onAdd(it.id, it.name, it.unit)}>+ {it.name}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
