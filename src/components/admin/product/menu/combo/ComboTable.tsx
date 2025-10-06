"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Trash2, Pencil } from "lucide-react";
import type { ComboItem } from "@/hooks/admin/useCombo";

function formatVND(x: string | number) {
  const n = typeof x === "string" ? Number(x) : x;
  return Number.isNaN(n) ? String(x) : n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
}

type Props = {
  data?: ComboItem[];
  total?: number;
  page: number;
  pages: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  isPlaceholderData: boolean;
  onPrev: () => void;
  onNext: () => void;
  onRefresh: () => void;
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  CreateButton?: React.ReactNode;
};

export default function ComboTable({
  data, total = 0, page, pages, isLoading, isFetching, error, isPlaceholderData,
  onPrev, onNext, onRefresh, onOpenDetail, onEdit, onDelete, CreateButton
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Combo</h1>
        <div className="flex items-center gap-2">
          {CreateButton}
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[10%]">Ảnh</TableHead>
              <TableHead className="w-[30%]">Tên combo</TableHead>
              <TableHead className="w-[20%]">Giá</TableHead>
              <TableHead className="w-[20%]">Trạng thái</TableHead>
              <TableHead className="w-[20%]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center">Đang tải…</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-red-500">{error.message}</TableCell></TableRow>
            ) : (data?.length ?? 0) === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (
              (data ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-100 border">
                      {m.image ? <img src={m.image} alt={m.name} width={64} height={64} className="w-16 h-16 object-cover" /> :
                        <div className="w-full h-full grid place-items-center text-xs text-slate-500">No img</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{m.name}</div>
                    {m.components?.length ? (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {m.components.slice(0,3).map(c => c.item?.name).filter(Boolean).join(", ")}
                        {m.components.length > 3 ? "…" : ""}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{formatVND(m.price)}</TableCell>
                  <TableCell>
                    {m.isAvailable
                      ? <Badge className="bg-emerald-600 hover:bg-emerald-700">Sẵn sàng</Badge>
                      : <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-200">Tạm ẩn</Badge>}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenDetail(m.id)}>
                      <Eye className="h-4 w-4 mr-1" /> Xem
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(m.id)}>
                      <Pencil className="h-4 w-4 mr-1" /> Sửa
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(m.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Xoá
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Tổng {total} mục · Trang {page}/{pages}
          {isPlaceholderData && <span className="ml-2">(đang tải trang mới…)</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1 || isFetching}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Trước
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={page >= pages || isFetching}>
            Sau <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
