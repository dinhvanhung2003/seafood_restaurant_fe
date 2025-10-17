"use client";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  isAvailable: "all" | "true" | "false";
  setIsAvailable: (v: "all" | "true" | "false") => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  sortBy: "name" | "price" | "createdAt";
  setSortBy: (v: "name" | "price" | "createdAt") => void;
  order: "ASC" | "DESC";
  setOrder: (v: "ASC" | "DESC") => void;
  setPage: (n: number) => void;
};

export default function MenuFilters({
  search, setSearch,
  isAvailable, setIsAvailable,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  sortBy, setSortBy,
  order, setOrder,
  setPage,
}: Props) {
  useEffect(() => { setPage(1); }, [search]);

  return (
    <Card className="p-4 grid gap-4 md:grid-cols-6">
      <div className="md:col-span-2">
        <Label>Tìm kiếm</Label>
        <Input placeholder="Tên hoặc mô tả" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

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
        <Input type="number" inputMode="numeric" value={minPrice}
               onChange={(e) => { setPage(1); setMinPrice(e.target.value); }} />
      </div>

      <div>
        <Label>Giá max</Label>
        <Input type="number" inputMode="numeric" value={maxPrice}
               onChange={(e) => { setPage(1); setMaxPrice(e.target.value); }} />
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
  );
}
