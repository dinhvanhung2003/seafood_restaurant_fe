// app/(admin)/categories/page.tsx (ví dụ đường dẫn trang của bạn)
"use client";

import { useMemo, useState, useEffect } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, RefreshCw, Trash2 } from "lucide-react";
import { useDebounce } from "use-debounce";
import CreateCategoryDialog from "@/components/admin/product/category/modal/CreateCategory";
import EditCategoryDialog from "@/components/admin/product/category/modal/EditCategory";

import {
  useCategoriesQuery,
  useRemoveCategoryMutation,
} from "@/hooks/admin/useCategory";
import { useToast } from "@/components/ui/use-toast";
import mapServerError from "@/lib/mapServerError";
import type { CategoryQuery } from "@/types/admin/product/category";

export default function CategoryListPage() {
  // UI state
  const [type, setType] = useState<string | "all">("all");
  const [isActive, setIsActive] = useState<"all" | "true" | "false">("all");
  const [q, setQ] = useState("");
  const [debouncedQ] = useDebounce(q, 400);
  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("createdAt:DESC");

  const apiParams = useMemo<CategoryQuery>(
    () => ({
      type: type !== "all" ? type : undefined,
      isActive: isActive !== "all" ? isActive : undefined,
      q: debouncedQ || undefined,
      page,
      limit,
      sort,
    }),
    [type, isActive, debouncedQ, page, limit, sort]
  );

  const { data, isLoading, isFetching, refetch, error } =
    useCategoriesQuery(apiParams);
  const remove = useRemoveCategoryMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const pages = data?.meta.pages ?? 1;
  const total = data?.meta.total ?? 0;

  // Ensure page size is fixed to 10 as requested
  useEffect(() => {
    setLimit(10);
  }, []);

  const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh mục</h1>

        <div className="flex items-center gap-2">
          <CreateCategoryDialog
            triggerLabel="Thêm danh mục"
            defaultType="MENU"
            onCreated={() => refetch()}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <Label>Tìm kiếm</Label>
          <Input
            placeholder="Tên hoặc mô tả"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div>
          <Label>Loại</Label>
          <Select
            value={type}
            onValueChange={(v) => {
              setPage(1);
              setType(v as any);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="MENU">MENU</SelectItem>
              <SelectItem value="INGREDIENT">INGREDIENT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Trạng thái</Label>
          <Select
            value={isActive}
            onValueChange={(v) => {
              setPage(1);
              setIsActive(v as any);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Đang dùng</SelectItem>
              <SelectItem value="false">Ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Sắp xếp</Label>
          <Select
            value={sort}
            onValueChange={(v) => {
              setPage(1);
              setSort(v);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:DESC">Mới nhất</SelectItem>
              <SelectItem value="createdAt:ASC">Cũ nhất</SelectItem>
              <SelectItem value="name:ASC">Tên A→Z</SelectItem>
              <SelectItem value="name:DESC">Tên Z→A</SelectItem>
              <SelectItem value="sortOrder:ASC">Thứ tự ↑</SelectItem>
              <SelectItem value="sortOrder:DESC">Thứ tự ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hiển thị removed per request */}
      </Card>

      {/* Table (desktop) + Card list (mobile) */}
      <div className="relative">
        <Card className="hidden md:block overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-white">
                <TableHead className="w-[44%]">Tên</TableHead>
                <TableHead className="w-[18%]">Loại</TableHead>
                <TableHead className="w-[18%]">Trạng thái</TableHead>
                <TableHead className="w-[14%]">Tạo lúc</TableHead>
                <TableHead className="w-[6%]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    Đang tải…
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-red-500"
                  >
                    {(error as Error).message || "Có lỗi xảy ra"}
                  </TableCell>
                </TableRow>
              ) : (data?.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                data!.data.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="font-medium text-slate-800">{c.name}</div>
                      {c.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {c.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          c.type === "MENU"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge className="bg-emerald-500 text-white">
                          Đang dùng
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-300 text-gray-800">Ẩn</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <div className="flex items-center gap-2">
                          <EditCategoryDialog
                            category={c}
                            onUpdated={() => refetch()}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            disabled={deletingId === c.id}
                            title={deletingId === c.id ? "Đang xóa..." : "Xóa"}
                            onClick={() => {
                              if (!confirm(`Xóa danh mục "${c.name}"?`)) return;
                              setDeletingId(c.id);
                              remove.mutate(
                                { id: c.id },
                                {
                                  onSuccess: () => {
                                    toast({
                                      title: "Xóa thành công",
                                    });
                                    refetch();
                                    setDeletingId(null);
                                  },
                                  onError: (err: any) => {
                                    const { message } = mapServerError(err);
                                    const box = (
                                      <div className="rounded-md bg-red-50 border border-red-100 p-2">
                                        <div className="text-sm font-medium text-red-800">
                                          {message}
                                        </div>
                                      </div>
                                    );
                                    toast({
                                      title: "Không thể xóa",
                                      description: box,
                                    });
                                    setDeletingId(null);
                                  },
                                  // --------------------
                                }
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Mobile: stacked cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="py-6 text-center">Đang tải…</div>
          ) : error ? (
            <div className="py-6 text-center text-red-500">
              {(error as Error).message || "Có lỗi xảy ra"}
            </div>
          ) : (data?.data?.length ?? 0) === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              Không có dữ liệu
            </div>
          ) : (
            data!.data.map((c) => (
              <Card key={c.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-slate-800">{c.name}</div>
                    {c.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {c.description}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          c.type === "MENU"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.type}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <EditCategoryDialog
                        category={c}
                        onUpdated={() => refetch()}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        disabled={deletingId === c.id}
                        title={deletingId === c.id ? "Đang xóa..." : "Xóa"}
                        onClick={() => {
                          if (!confirm(`Xóa danh mục "${c.name}"?`)) return;
                          setDeletingId(c.id);
                          remove.mutate(
                            { id: c.id },
                            {
                              onSuccess: () => {
                                toast({ title: "Xóa thành công" });
                                refetch();
                                setDeletingId(null);
                              },
                              onError: (err: any) => {
                                const { message } = mapServerError(err);
                                const box = (
                                  <div className="rounded-md bg-red-50 border border-red-100 p-2">
                                    <div className="text-sm font-medium text-red-800">
                                      {message}
                                    </div>
                                  </div>
                                );
                                toast({
                                  title: "Lỗi khi xóa",
                                  description: box,
                                });
                                setDeletingId(null);
                              },
                            }
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      {c.isActive ? (
                        <Badge className="bg-emerald-500 text-white">
                          Đang dùng
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-300 text-gray-800">Ẩn</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-3">
                  Tạo lúc: {new Date(c.createdAt).toLocaleString()}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Loading overlay when fetching (e.g., after changing filters) */}
        {isFetching && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
            <div className="relative flex items-center gap-2 rounded px-4 py-2 bg-white/80 shadow">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-700" />
              <span className="text-sm text-slate-700">Đang tải…</span>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Tổng {total} mục · Trang {page}/{pages}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground hidden sm:block">
            1 trang = 10 mục
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  disabled={isFetching}
                  className={`px-2 py-1 rounded text-sm ${
                    n === page
                      ? "bg-slate-800 text-white"
                      : "bg-transparent text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages || isFetching}
            >
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
