"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Trash2,
} from "lucide-react";

type MenuItem = {
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
  } | null;
  isAvailable: boolean;
  ingredients: Array<{ id: string; quantity: string; note: string | null }>;
};

function formatVND(x: string | number) {
  const num = typeof x === "string" ? Number(x) : x;
  if (Number.isNaN(num)) return String(x);
  return num.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

type Props = {
  data?: MenuItem[];
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
  onCreated?: () => void;
  CreateButton?: React.ReactNode;
  onDelete?: (id: string) => void;
};

export default function MenuTable({
  data,
  total = 0,
  page,
  pages,
  isLoading,
  isFetching,
  error,
  isPlaceholderData,
  onPrev,
  onNext,
  onRefresh,
  onOpenDetail,
  CreateButton,
  onDelete,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* <h1 className="text-2xl font-semibold">Thực đơn</h1> */}
        <div className="flex items-center gap-2">
          {CreateButton}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-x-auto shadow-md rounded-xl">
        <Table className="min-w-[900px]">
          <TableHeader className="sticky top-0 z-20">
            <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead className="w-[10%] text-base font-semibold">
                Ảnh
              </TableHead>
              <TableHead className="w-[28%] text-base font-semibold">
                Tên món
              </TableHead>
              <TableHead className="w-[18%] text-base font-semibold">
                Danh mục
              </TableHead>
              <TableHead className="w-[16%] text-base font-semibold">
                Giá
              </TableHead>
              <TableHead className="w-[16%] text-base font-semibold">
                Trạng thái
              </TableHead>
              <TableHead className="w-[12%] text-base font-semibold">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  Đang tải…
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-red-500"
                >
                  {error.message || "Có lỗi xảy ra"}
                </TableCell>
              </TableRow>
            ) : (data?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              (data ?? []).map((m) => (
                <TableRow
                  key={m.id}
                  className="transition-colors hover:bg-slate-50 border-b border-slate-100"
                >
                  <TableCell>
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border shadow-sm">
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

                  <TableCell>
                    <div className="font-semibold text-base">{m.name}</div>
                    {m.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {m.description}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-base">
                    {m.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-base">
                    {formatVND(m.price)}
                  </TableCell>
                  <TableCell>
                    {m.isAvailable ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-full">
                        Sẵn sàng
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full"
                      >
                        Tạm ẩn
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-semibold"
                      onClick={() => onOpenDetail(m.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Xem
                    </Button>
                    {onDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (!confirm(`Xóa món “${m.name}”?`)) return;
                          onDelete(m.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Xóa
                      </Button>
                    )}
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
          Tổng {total} mục · Trang {page}/{pages}
          {isPlaceholderData && (
            <span className="ml-2">(đang tải trang mới…)</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={page <= 1 || isFetching}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={page >= pages || isFetching}
          >
            Sau <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
