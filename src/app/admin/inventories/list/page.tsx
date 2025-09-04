"use client";

import React, { useMemo, useState } from "react";
import { useIngredients, useStockInIngredient, IngredientDTO } from "@/features/admin/inventory/api";
import { useAppToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton"; 

export default function IngredientsPage() {


  console.log("Rerender IngredientsPage");
  const toast = useAppToast();

  // Query list
  const { data, isLoading, error, isFetching } = useIngredients();
  const ingredients = (data ?? []) as IngredientDTO[];

  // Search + filter
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      ingredients.filter(
        (i) =>
          !search ||
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.unit.toLowerCase().includes(search.toLowerCase())
      ),
    [ingredients, search]
  );

  // Modal state (stock-in)
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
    if (!form.name.trim()) {
      toast.error("Tên nguyên liệu không được trống");
      return;
    }
    if (!form.unit.trim()) {
      toast.error("Đơn vị không được trống");
      return;
    }
    if (Number.isNaN(+form.quantity) || +form.quantity < 0) {
      toast.error("Số lượng không hợp lệ");
      return;
    }
    if (Number.isNaN(+form.alertThreshold) || +form.alertThreshold < 0) {
      toast.error("Ngưỡng cảnh báo không hợp lệ");
      return;
    }

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
          setForm({ name: "", unit: "kg", quantity: 0, alertThreshold: 0, description: "" });
        },
        onError: () => {
          toast.error("Nhập kho thất bại");
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nguyên liệu</h1>
          <p className="text-sm text-muted-foreground">Quản lý tồn kho nguyên liệu</p>
        </div>
        <div className="flex items-center gap-2">
          {(isLoading || (isFetching && !isLoading)) && (
            <Skeleton className="h-4 w-28" />
          )}
          {error && <span className="text-xs text-red-600">Không tải được dữ liệu</span>}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:opacity-90">+ Nhập kho nguyên liệu</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nhập kho nguyên liệu</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Tên</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ví dụ: Tôm hùm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Đơn vị</Label>
                    <Input
                      value={form.unit}
                      onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                      placeholder="kg, chai, thùng…"
                    />
                  </div>
                  <div>
                    <Label>Số lượng</Label>
                    <Input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                      min={0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Ngưỡng cảnh báo</Label>
                    <Input
                      type="number"
                      value={form.alertThreshold}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, alertThreshold: Number(e.target.value) }))
                      }
                      min={0}
                    />
                  </div>
                  <div className="flex items-end">
                    <span className="text-xs text-muted-foreground">
                      Báo động khi tồn &le; ngưỡng
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Mô tả</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Ghi chú chất lượng, lô nhập, ..."
                  />
                </div>
              </div>

              <DialogFooter className="mt-2">
                <DialogClose asChild>
                  <Button variant="outline">Huỷ</Button>
                </DialogClose>
                <Button onClick={onSubmit} disabled={stockIn.isPending}>
                  {stockIn.isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Search */}
      <div className="mb-4">
        {isLoading ? (
          <Skeleton className="h-9 w-80" />
        ) : (
          <Input
            placeholder="Tìm theo tên hoặc đơn vị…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
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

          {/* Skeleton body khi tải lần đầu */}
          {isLoading ? (
            <tbody>
              {Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-12 rounded" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-64" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody className={isFetching ? "opacity-70 transition-opacity" : undefined}>
              {filtered.map((i) => {
                const low = i.quantity <= i.alertThreshold;
                return (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{i.name}</td>
                    <td className="px-4 py-2">{i.unit}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          low ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {i.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-2">{i.alertThreshold}</td>
                    <td className="px-4 py-2 text-gray-600">{i.description ?? "-"}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {i.updatedAt ? new Date(i.updatedAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </section>
    </div>
  );
}
