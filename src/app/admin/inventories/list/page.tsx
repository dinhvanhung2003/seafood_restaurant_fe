// app/admin/inventory/ingredients/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useIngredients,
  useStockInIngredient,
  StockFilter,
} from "@/hooks/admin/useIngredients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function IngredientsPage() {
  /** Paging + search (debounce) */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced]); // đổi keyword thì về trang 1

  /** NEW: filters khớp BE */
  const [stock, setStock] = useState<StockFilter>("ALL");
  const [baseUomCode, setBaseUomCode] = useState<string | undefined>(undefined);
  useEffect(() => setPage(1), [stock, baseUomCode]);

  /** Call hook (server-side filter + pagination) */
  const {
    data: ingredients = [],
    meta,
    isLoading,
    isFetching,
  } = useIngredients(page, limit, debounced, stock, baseUomCode);

  /** Lấy danh sách UOM từ data hiện tại (nếu có API UOM riêng thì thay bằng hook riêng) */
  const uomOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of ingredients) if (r.unit) set.add(r.unit);
    return Array.from(set);
  }, [ingredients]);

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.pages;

  // (Tuỳ) còn mutation nhập kho của bạn:
  const stockIn = useStockInIngredient();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
      {/* ================= Sidebar Filters ================= */}
      <aside className="space-y-4">
        {/* Tồn kho */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium mb-3">Tồn kho</div>
          <div className="space-y-2 text-sm">
            {(
              [
                ["ALL", "Tất cả"],
                ["BELOW", "Dưới định mức tồn"],
                ["OVER", "Vượt định mức tồn"],
                ["IN_STOCK", "Còn hàng trong kho"],
                ["OUT_OF_STOCK", "Hết hàng trong kho"],
              ] as [StockFilter, string][]
            ).map(([val, label]) => (
              <label
                key={val}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="stock"
                  value={val}
                  checked={stock === val}
                  onChange={() => setStock(val)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* ================= Main ================= */}
      <div>
        {/* Search + page size */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {isLoading ? (
            <Skeleton className="h-9 w-80" />
          ) : (
            <Input
              placeholder="Tìm theo tên hoặc đơn vị…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-md"
            />
          )}

          <div className="flex items-center gap-2 text-sm">
            <span>Hiển thị</span>
            <select
              className="border rounded px-2 py-1"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>bản ghi / trang</span>
          </div>
        </div>

        {/* Bảng */}
        <section className="rounded-2xl border overflow-x-auto">
          <table className="min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Đơn vị</th>
                <th className="px-4 py-3">Số lượng</th>
                <th className="px-4 py-3">Ngưỡng cảnh báo</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">Cập nhật</th>
              </tr>
            </thead>
            <tbody className={isFetching ? "opacity-70" : undefined}>
              {ingredients.map((i) => {
                const low = i.quantity <= i.alertThreshold;
                return (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{i.name}</td>
                    <td className="px-4 py-2">{i.unit}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          low
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {i.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-2">{i.alertThreshold}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {i.description ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {i.updatedAt
                        ? new Date(i.updatedAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                );
              })}
              {ingredients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>
            Trang {meta.page}/{meta.pages} • Tổng {meta.total} bản ghi
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1 || isFetching}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setPage((p) => Math.min(meta.pages || p + 1, p + 1))
              }
              disabled={meta.page >= meta.pages || isFetching}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
