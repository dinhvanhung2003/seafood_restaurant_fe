"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RefreshCw, Trash2 } from "lucide-react";
import {
  useUomsQuery,
  useRemoveUomMutation,
} from "@/hooks/admin/useUnitsOfMeasure";
import type { UnitOfMeasureQuery } from "@/types/admin/product/uom";
import { useAppToast } from "@/lib/toast";
import { UomCreateDialog } from "./UomCreateDialog";
import { UomEditDialog } from "./UomEditDialog";

export default function UomListPage() {
  const router = useRouter();
  const toast = useAppToast();

  const [q, setQ] = useState("");
  const [debouncedQ] = useDebounce(q, 400);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [dimension, setDimension] = useState<string>("none");
  const [page, setPage] = useState(1);
  // Bỏ chọn số lượng hiển thị (mặc định 10)
  const [sortBy, setSortBy] = useState<"code" | "name" | "dimension" | "none">(
    "none"
  );
  const [sortDir, setSortDir] = useState<"ASC" | "DESC" | "none">("none");

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, code, name, dimension, sortBy, sortDir]);

  const params = useMemo<UnitOfMeasureQuery>(
    () => ({
      page,
      limit: 10,
      q: debouncedQ || undefined,
      code: code.trim() || undefined,
      name: name.trim() || undefined,
      dimension: dimension !== "none" ? (dimension as any) : undefined,
      sortBy: sortBy !== "none" ? sortBy : undefined,
      sortDir: sortDir !== "none" ? sortDir : undefined,
    }),
    [page, debouncedQ, code, name, dimension, sortBy, sortDir]
  );

  const { data, isLoading, isFetching, refetch, error } = useUomsQuery(params);
  const pages = data?.meta.pages ?? 1;
  const total = data?.meta.total ?? 0;

  const removeMut = useRemoveUomMutation({
    onSuccess: () => toast.success("Đã xóa đơn vị tính"),
    onError: (e) => toast.error("Xóa thất bại", (e as Error)?.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Đơn vị tính</h1>
        <div className="flex items-center gap-2">
          <UomCreateDialog onCreated={() => refetch()} />
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

      <Card className="p-4 grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label>Tìm kiếm</Label>
          <Input
            placeholder="Mã hoặc tên"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <Label>Mã (chính xác)</Label>
          <Input
            placeholder="VD: G, KG"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <Label>Tên (chứa chuỗi)</Label>
          <Input
            placeholder="ví dụ: Gram"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label>Quy cách đo</Label>
          <Select value={dimension} onValueChange={(v) => setDimension(v)}>
            <SelectTrigger>
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">--</SelectItem>
              <SelectItem value="count">Số lượng (count)</SelectItem>
              <SelectItem value="mass">Khối lượng (mass)</SelectItem>
              <SelectItem value="volume">Thể tích (volume)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Sắp xếp theo</Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Mặc định" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Mặc định</SelectItem>
              <SelectItem value="code">Mã</SelectItem>
              <SelectItem value="name">Tên</SelectItem>
              <SelectItem value="dimension">Quy cách đo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Chiều sắp xếp</Label>
          <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">--</SelectItem>
              <SelectItem value="ASC">ASC</SelectItem>
              <SelectItem value="DESC">DESC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[18%]">Mã</TableHead>
              <TableHead className="w-[42%]">Tên</TableHead>
              <TableHead className="w-[18%]">Quy cách đo</TableHead>
              <TableHead className="w-[22%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  Đang tải…
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-red-500"
                >
                  {(error as Error).message || "Có lỗi xảy ra"}
                </TableCell>
              </TableRow>
            ) : (data?.data?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data!.data.map((u) => (
                <TableRow key={u.code}>
                  <TableCell className="font-mono">{u.code}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase">
                      {u.dimension}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <UomEditDialog
                      uom={u}
                      onUpdated={() => {
                        refetch();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (!confirm(`Xóa đơn vị "${u.name}" (${u.code})?`))
                          return;
                        removeMut.mutate({ code: u.code });
                      }}
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
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
