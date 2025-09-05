"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useDebounce } from "use-debounce";
import CreateCategoryDialog from "@/components/admin/product/category/modal/CreateCategory";
// ===== Types =====
export type Category = {
  id: string;
  name: string;
  description: string | null;
  type: string; // ví dụ: "MENU"
  isActive: boolean;
  sortOrder: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type CategoryListResponse = {
  data: Category[];
  meta: { total: number; page: number; limit: number; pages: number };
};

export type CategoryQuery = {
  type?: string; // e.g. MENU
  isActive?: string; // "true" | "false"
  q?: string;
  page?: number;
  limit?: number;
  sort?: string; // e.g. createdAt:DESC
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchCategories(params: CategoryQuery): Promise<CategoryListResponse> {
  const url = new URL(`${API_BASE}/category/list-category`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && `${v}` !== "") url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Fetch failed: ${res.status}`);
  }
  return res.json();
}

function useCategoriesQuery(params: CategoryQuery) {
  return useQuery<CategoryListResponse, Error>({
    queryKey: ["categories", params],
    queryFn: () => fetchCategories(params),
    placeholderData: keepPreviousData, 
    staleTime: 30_000,
  });
}
export default function CategoryListPage() {
  // UI state
  const [type, setType] = useState<string | "all">("all");
  const [isActive, setIsActive] = useState<"all" | "true" | "false">("all");
  const [q, setQ] = useState("");
  const [debouncedQ] = useDebounce(q, 400);
  useEffect(() => { setPage(1); }, [debouncedQ]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("createdAt:DESC");

  const apiParams = useMemo<CategoryQuery>(() => ({
    type: type !== "all" ? type : undefined,
    isActive: isActive !== "all" ? isActive : undefined,
    q: debouncedQ || undefined,
    page,
    limit,
    sort,
  }), [type, isActive, debouncedQ, page, limit, sort]);

  const { data, isLoading, isFetching, refetch, error } = useCategoriesQuery(apiParams);

  const pages = data?.meta.pages ?? 1;
  const total = data?.meta.total ?? 0;

  return (
    <div className="space-y-4">
    <div className="flex items-center justify-between">
  <h1 className="text-2xl font-semibold">Danh mục</h1>

  <div className="flex items-center gap-2">
    {/* Nút mở modal tạo mới */}
    <CreateCategoryDialog
      triggerLabel="Thêm danh mục"
      defaultType="MENU"
      onCreated={() => refetch()} // sau khi tạo xong thì refetch list hiện tại
    />

    {/* Nút làm mới */}
    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
      <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
      Làm mới
    </Button>
  </div>
</div>


      {/* Filters */}
      <Card className="p-4 grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <Label>Tìm kiếm</Label>
          <Input placeholder="Tên hoặc mô tả" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div>
          <Label>Loại</Label>
          <Select value={type} onValueChange={(v) => { setPage(1); setType(v as any); }}>
            <SelectTrigger>
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="MENU">MENU</SelectItem>
              <SelectItem value="INGREDIENT">INGREDIENT</SelectItem>
              {/* Thêm loại khác nếu BE có */}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Trạng thái</Label>
          <Select value={isActive} onValueChange={(v) => { setPage(1); setIsActive(v as any); }}>
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
          <Select value={sort} onValueChange={(v) => { setPage(1); setSort(v); }}>
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

        <div>
          <Label>Hiển thị</Label>
          <Select value={String(limit)} onValueChange={(v) => { setPage(1); setLimit(Number(v)); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}/trang</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[42%]">Tên</TableHead>
              <TableHead className="w-[18%]">Loại</TableHead>
              <TableHead className="w-[14%]">Trạng thái</TableHead>
              <TableHead className="w-[12%]">Thứ tự</TableHead>
              <TableHead className="w-[14%]">Tạo lúc</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">Đang tải…</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-red-500">
                  {(error as Error).message || "Có lỗi xảy ra"}
                </TableCell>
              </TableRow>
            ) : (data?.data?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Không có dữ liệu</TableCell>
              </TableRow>
            ) : (
              data!.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    {c.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">{c.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="uppercase">{c.type}</TableCell>
                  <TableCell>
                    {c.isActive ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">Đang dùng</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200">Ẩn</Badge>
                    )}
                  </TableCell>
                  <TableCell>{c.sortOrder}</TableCell>
                  <TableCell>{new Date(c.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Tổng {total} mục · Trang {page}/{pages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || isFetching}
          >
            Sau <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/*
Ghi chú:
- Trang này giả định bạn đã wrap app bằng <QueryClientProvider> ở layout gốc.
- Nếu API cần Authorization, thêm header ở fetchCategories (Bearer token...).
- Nếu field "type" có nhiều giá trị hơn, thêm vào <SelectContent> ở phần Lọc.
*/
