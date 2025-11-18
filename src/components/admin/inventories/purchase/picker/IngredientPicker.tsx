"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIngredients } from "@/hooks/admin/useIngredients";
import type { StockFilter } from "@/hooks/admin/useIngredients";

export default function IngredientPicker({
  supplierId,
  onAdd, // (id, name, unitCode?)
  onOpenAddIngredient,
}: {
  supplierId?: string;
  onAdd: (id: string, name: string, unitCode?: string) => void;
  onOpenAddIngredient: (v: boolean) => void;
}) {
  const [page] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [stock] = useState<StockFilter>("ALL");
  // Bỏ lọc theo NCC theo yêu cầu: luôn hiển thị toàn bộ nguyên liệu

  const ingQuery = useIngredients(
    page,
    limit,
    search,
    stock,
    undefined,
    undefined
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex flex-col">
          <CardTitle>Chọn nguyên liệu</CardTitle>
        </div>
        <Button variant="outline" onClick={() => onOpenAddIngredient(true)}>
          + Thêm nguyên liệu
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <Input
          placeholder="Nhập để tìm nguyên liệu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ScrollArea className="h-[320px] rounded-md border">
          {ingQuery.isFetching ? (
            <div className="p-3 text-sm text-muted-foreground">Đang tải…</div>
          ) : (
            <ul className="divide-y">
              {(ingQuery.data ?? []).map((it) => (
                <li
                  key={it.id}
                  className="px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-slate-500">
                      Đơn vị: {it.unit} • Tồn: {it.quantity}
                    </div>
                  </div>
                  {/* QUAN TRỌNG: truyền unitCode (KG/CAN/PCS…), không phải unit name */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAdd(it.id, it.name, it.unitCode)}
                  >
                    + Thêm
                  </Button>
                </li>
              ))}
              {(ingQuery.data ?? []).length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground space-y-2">
                  <div>Không có kết quả</div>
                </li>
              )}
            </ul>
          )}
        </ScrollArea>

        <div className="text-sm text-slate-600">
          <div className="mb-2 font-medium">Thêm nhanh:</div>
          <div className="flex flex-wrap gap-2">
            {(ingQuery.data ?? []).slice(0, 10).map((it) => (
              <Badge
                key={it.id}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onAdd(it.id, it.name, it.unitCode)}
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
