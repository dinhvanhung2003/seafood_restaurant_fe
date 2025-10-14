"use client";

import React, { useEffect, useState } from "react";
import {
  useIngredients,
  useStockInIngredient,
} from "@/hooks/admin/useIngredients";
import { useAppToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function IngredientsPage() {
  const toast = useAppToast();

  // --- paging + search ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced]); // đổi keyword thì về trang 1

  // GỌI HOOK mới (đã sửa TListQuery ở file hook)
  const {
    data: ingredients = [],
    meta, // <-- lấy meta để vẽ phân trang
    isLoading,
    error,
    isFetching,
  } = useIngredients(page, limit, debounced);

  // --- modal nhập kho (giữ nguyên) ---
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    unit: "kg",
    quantity: 0,
    alertThreshold: 0,
    description: "",
  });
  const stockIn = useStockInIngredient();

  const onSubmit = () => {
    if (!form.name.trim())
      return toast.error("Tên nguyên liệu không được trống");
    if (!form.unit.trim()) return toast.error("Đơn vị không được trống");
    if (Number.isNaN(+form.quantity) || +form.quantity < 0)
      return toast.error("Số lượng không hợp lệ");
    if (Number.isNaN(+form.alertThreshold) || +form.alertThreshold < 0)
      return toast.error("Ngưỡng cảnh báo không hợp lệ");

    stockIn.mutate(
      {
        name: form.name.trim(),
        unit: form.unit.trim(),
        quantity: +form.quantity,
        alertThreshold: +form.alertThreshold,
        description: form.description?.trim() || undefined,
      },
      {
        onSuccess: (ing) => {
          toast.success("Đã nhập kho nguyên liệu", ing.name);
          setOpen(false);
          setForm({
            name: "",
            unit: "kg",
            quantity: 0,
            alertThreshold: 0,
            description: "",
          });
        },
        onError: () => toast.error("Nhập kho thất bại"),
      }
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* header + modal giữ nguyên... */}

      {/* Search + page-size */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {isLoading ? (
          <Skeleton className="h-9 w-80" />
        ) : (
          <Input
            placeholder="Tìm theo tên hoặc đơn vị…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Table */}
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

          {isLoading ? (
            <tbody>
              {Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-6 w-12 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-64" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-28" />
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody
              className={
                isFetching ? "opacity-70 transition-opacity" : undefined
              }
            >
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
                    className="px-4 py-8 text-center text-gray-500"
                    colSpan={6}
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          )}
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
            onClick={() => setPage((p) => Math.min(meta.pages || p + 1, p + 1))}
            disabled={meta.page >= meta.pages || isFetching}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
