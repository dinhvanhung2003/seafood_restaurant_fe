"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useSession } from "next-auth/react";


import Image from "next/image";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, RefreshCw, Eye } from "lucide-react";

import CreateMenuItemDialog from "@/components/admin/product/menu/modal/CreateMenuModal";


// ========= Types =========
export type MenuItem = {
  id: string;
  name: string;
  price: string; // BE trả string
  description: string | null;
  image: string | null;
  category: {
    id: string;
    name: string;
    description: string | null;
    type: "MENU";
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  };
  isAvailable: boolean;
  ingredients: Array<{ id: string; quantity: string; note: string | null }>;
};

export type MenuItemsList = {
  data: MenuItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type MenuItemsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isAvailable?: string; // "true" | "false"
  minPrice?: number | string;
  maxPrice?: number | string;
  sortBy?: "name" | "price" | "createdAt";
  order?: "ASC" | "DESC";
};

export type HeadersMap = Record<string, string>;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function buildUrl(path: string, params: Record<string, any>) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function fetchMenuItems(params: MenuItemsQuery, accessToken?: string): Promise<{ body: MenuItemsList; headers: HeadersMap }> {
  const url = buildUrl("/menuitems/list-menuitems", params);
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });
  const headers: HeadersMap = Object.fromEntries(res.headers.entries());
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Fetch failed: ${res.status}`);
  }
  const body = (await res.json()) as MenuItemsList;
  return { body, headers };
}

async function fetchMenuItemDetail(id: string, accessToken?: string): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menuitems/${id}`, {
    headers: {
      "Accept": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Fetch failed: ${res.status}`);
  }
  return res.json();
}

function useMenuItemsQuery(params: MenuItemsQuery) {
  const { data: session } = useSession();
  return useQuery<{ body: MenuItemsList; headers: HeadersMap }, Error>({
    queryKey: ["menuitems", params],
    queryFn: () => fetchMenuItems(params, (session as any)?.accessToken),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

function useMenuItemDetailQuery(id?: string) {
  const { data: session } = useSession();
  return useQuery<MenuItem, Error>({
    queryKey: ["menuitem", id],
    queryFn: () => fetchMenuItemDetail(id!, (session as any)?.accessToken),
    enabled: Boolean(id),
  });
}

function formatVND(x: string | number) {
  const num = typeof x === "string" ? Number(x) : x;
  if (Number.isNaN(num)) return String(x);
  return num.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
}

export default function MenuItemsPage() {
  // ===== filters & state =====
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
 

const [search, setSearch] = useState("");
const [debouncedSearch] = useDebounce(search,1000);

  const [categoryId, setCategoryId] = useState("");
  const [isAvailable, setIsAvailable] = useState<"all" | "true" | "false">("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<MenuItemsQuery["sortBy"]>("name");
  const [order, setOrder] = useState<MenuItemsQuery["order"]>("ASC");

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const params = useMemo<MenuItemsQuery>(() => ({
    page,
    limit,
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    isAvailable: isAvailable === "all" ? undefined : isAvailable,
    minPrice: minPrice === "" ? undefined : Number(minPrice),
    maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
    sortBy,
    order,
  }), [page, limit, debouncedSearch, categoryId, isAvailable, minPrice, maxPrice, sortBy, order]);

  const { data, isLoading, isFetching, error, refetch, isPlaceholderData } = useMenuItemsQuery(params);

  const body = data?.body;
  const headers = data?.headers ?? {};

  // detail modal
  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const detailQuery = useMenuItemDetailQuery(detailId);

  const pages = body?.meta.totalPages ?? 1;
  const total = body?.meta.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Thực đơn</h1>
       <div className="flex items-center gap-2">
  <CreateMenuItemDialog onCreated={() => refetch()} />
  <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
    <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
    Làm mới
  </Button>
</div>
      </div>

      {/* Filters */}
      <Card className="p-4 grid gap-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <Label>Tìm kiếm</Label>
          <Input placeholder="Tên hoặc mô tả" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {/* <div>
          <Label>Danh mục (UUID)</Label>
          <Input placeholder="categoryId" value={categoryId} onChange={(e) => { setPage(1); setCategoryId(e.target.value); }} />
        </div> */}
        <div>
          <Label>Trạng thái</Label>
          <Select value={isAvailable} onValueChange={(v) => { setPage(1); setIsAvailable(v as any); }}>
            <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Sẵn sàng</SelectItem>
              <SelectItem value="false">Tạm ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Giá min</Label>
          <Input type="number" inputMode="numeric" value={minPrice} onChange={(e) => { setPage(1); setMinPrice(e.target.value); }} />
        </div>
        <div>
          <Label>Giá max</Label>
          <Input type="number" inputMode="numeric" value={maxPrice} onChange={(e) => { setPage(1); setMaxPrice(e.target.value); }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Sắp xếp theo</Label>
            <Select value={sortBy} onValueChange={(v) => { setPage(1); setSortBy(v as any); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Tên</SelectItem>
                <SelectItem value="price">Giá</SelectItem>
                <SelectItem value="createdAt">Ngày tạo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Thứ tự</Label>
            <Select value={order} onValueChange={(v) => { setPage(1); setOrder(v as any); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ASC">ASC</SelectItem>
                <SelectItem value="DESC">DESC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Optional: show response headers
      <Card className="p-3">
        <div className="text-sm text-muted-foreground">Response headers (từ list):</div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {Object.keys(headers).length === 0 ? (
            <div className="text-muted-foreground">(empty)</div>
          ) : (
            Object.entries(headers).map(([k, v]) => (
              <div key={k} className="rounded-md bg-slate-50 px-2 py-1 border">
                <span className="font-medium">{k}</span>: {v}
              </div>
            ))
          )}
        </div>
      </Card> */}

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
         <TableHeader>
  <TableRow className="bg-slate-50">
    <TableHead className="w-[10%]">Ảnh</TableHead>
    <TableHead className="w-[28%]">Tên món</TableHead>
    <TableHead className="w-[18%]">Danh mục</TableHead>
    <TableHead className="w-[16%]">Giá</TableHead>
    <TableHead className="w-[16%]">Trạng thái</TableHead>
    <TableHead className="w-[12%]">Hành động</TableHead>
  </TableRow>
</TableHeader>
       <TableBody>
  {isLoading ? (
    <TableRow>
      <TableCell colSpan={6} className="py-10 text-center">Đang tải…</TableCell>
    </TableRow>
  ) : error ? (
    <TableRow>
      <TableCell colSpan={6} className="py-10 text-center text-red-500">
        {(error as Error).message || "Có lỗi xảy ra"}
      </TableCell>
    </TableRow>
  ) : (body?.data?.length ?? 0) === 0 ? (
    <TableRow>
      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
        Không có dữ liệu
      </TableCell>
    </TableRow>
  ) : (
    (body?.data ?? []).map((m) => (
      <TableRow key={m.id}>
        {/* Ảnh */}
        <TableCell>
          <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-100 border">
            {m.image ? (
              <img
                src={m.image}
                alt={m.name}
                width={64}
                height={64}
                className="w-16 h-16 object-cover"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-slate-500">
                No img
              </div>
            )}
          </div>
        </TableCell>

        {/* Tên + mô tả */}
        <TableCell>
          <div className="font-medium">{m.name}</div>
          {m.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {m.description}
            </div>
          )}
        </TableCell>

        <TableCell>{m.category?.name ?? "—"}</TableCell>
        <TableCell>{formatVND(m.price)}</TableCell>
        <TableCell>
          {m.isAvailable ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-700">Sẵn sàng</Badge>
          ) : (
            <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200">
              Tạm ẩn
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <Button variant="outline" size="sm" onClick={() => setDetailId(m.id)}>
            <Eye className="h-4 w-4 mr-2" /> Xem
          </Button>
        </TableCell>
      </TableRow>
    ))
  )}
</TableBody>

        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Tổng {total} mục · Trang {body?.meta.page ?? page}/{pages}
          {isPlaceholderData && <span className="ml-2">(đang tải trang mới…)</span>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={(body?.meta.page ?? page) <= 1 || isFetching}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={(body?.meta.page ?? page) >= pages || isFetching}
          >
            Sau <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={Boolean(detailId)} onOpenChange={(v) => !v && setDetailId(undefined)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết món</DialogTitle>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="py-6 text-center">Đang tải…</div>
          ) : detailQuery.error ? (
            <div className="py-6 text-center text-red-500">{(detailQuery.error as Error).message}</div>
          ) : detailQuery.data ? (
            <div className="space-y-3">
              <div>
                <div className="text-lg font-semibold">{detailQuery.data.name}</div>
                {/* <div className="text-sm text-muted-foreground">ID: {detailQuery.data.id}</div> */}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="font-medium">Danh mục:</span> {detailQuery.data.category?.name ?? "—"}</div>
                <div><span className="font-medium">Giá:</span> {formatVND(detailQuery.data.price)}</div>
                <div className="col-span-2">
                  <span className="font-medium">Mô tả:</span> {detailQuery.data.description ?? "—"}
                </div>
                <div>
                  <span className="font-medium">Trạng thái:</span> {detailQuery.data.isAvailable ? "Sẵn sàng" : "Tạm ẩn"}
                </div>
              </div>

              <div>
                <div className="font-medium mb-1">Nguyên liệu ({detailQuery.data.ingredients.length})</div>
                {detailQuery.data.ingredients.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Không có nguyên liệu</div>
                ) : (
                  <ul className="list-disc pl-6 text-sm">
                    {detailQuery.data.ingredients.map((ing) => (
                      <li key={ing.id}>
                       SL: {ing.quantity}
                        {ing.note ? ` — ${ing.note}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailId(undefined)}>Đóng</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
