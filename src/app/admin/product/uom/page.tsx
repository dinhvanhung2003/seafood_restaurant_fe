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
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, RefreshCw, Trash2 } from "lucide-react";
import {
  useUomsQuery,
  useRemoveUomMutation,
  useUpdateUomMutation,
} from "@/hooks/admin/useUnitsOfMeasure";
import { api } from "@/lib/axios";
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
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, code, name, dimension, sortBy, sortDir]);
  useEffect(() => setPage(1), [showInactive]);

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
      isActive: showInactive ? undefined : true,
    }),
    [page, debouncedQ, code, name, dimension, sortBy, sortDir, showInactive]
  );

  const { data, isLoading, isFetching, refetch, error } = useUomsQuery(params);
  const pages = data?.meta.pages ?? 1;
  const total = data?.meta.total ?? 0;

  const removeMut = useRemoveUomMutation({
    onSuccess: (res) => {
      // BE can soft-delete -> returns different messages
      const msg: string | undefined = (res as any)?.message;
      switch (msg) {
        case "UOM_DEACTIVATED":
          toast.info(
            "Đơn vị đang được sử dụng. Đã chuyển sang trạng thái ngưng hoạt động."
          );
          break;
        case "UOM_DELETED":
          toast.success("Đã xóa đơn vị tính");
          break;
        default:
          toast.success("Xóa đơn vị tính thành công");
      }
      // Ensure the list refreshes immediately when server changes the active flag
      refetch();
    },
    onError: (e) => toast.error("Xóa thất bại", (e as Error)?.message),
  });

  const updateMut = useUpdateUomMutation({
    onSuccess: () => {
      toast.success("Đã chuyển đơn vị sang trạng thái ngưng hoạt động");
      refetch();
    },
    onError: (e) =>
      toast.error("Không thể ngưng hoạt động", (e as Error)?.message),
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
          <div className="flex items-center gap-2 pl-2">
            <span className="text-sm text-muted-foreground">
              Hiển thị ngưng hoạt động
            </span>
            <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          </div>
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
              <TableHead className="w-[12%]">Mã</TableHead>
              <TableHead className="w-[34%]">Tên</TableHead>
              <TableHead className="w-[12%]">Quy cách đo</TableHead>
              <TableHead className="w-[20%]">Đơn vị cơ sở</TableHead>
              <TableHead className="w-[12%]">Trạng thái</TableHead>
              <TableHead className="w-[10%]"></TableHead>
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
                  {(error as Error).message || "Có lỗi xảy ra"}
                </TableCell>
              </TableRow>
            ) : (data?.data?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data!.data.map((u) => (
                <TableRow key={u.code}>
                  <TableCell className="font-mono">{u.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{u.name}</span>
                      {u.baseName && (
                        <span className="text-xs text-muted-foreground">
                          Base: {u.baseName} ({u.baseCode})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase">
                      {u.dimension}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.baseName ? (
                      <span className="text-sm text-muted-foreground">
                        {u.baseName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {u.baseCode}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.isActive === false ? (
                      <Badge className="uppercase" variant="destructive">
                        NGƯNG hoạt động
                      </Badge>
                    ) : (
                      <Badge className="uppercase" variant="outline">
                        Hoạt động
                      </Badge>
                    )}
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
                      onClick={async () => {
                        // pre-check if this UOM is referenced anywhere so we can ask
                        // the user whether they want to deactivate instead
                        try {
                          const c = u.code;
                          const [invRes, convFromRes, convToRes, ingRes] =
                            await Promise.all([
                              api
                                .get("/inventoryitems/list-ingredients", {
                                  params: { limit: 1, baseUomCode: c },
                                })
                                .catch(() => ({ data: { data: [] } } as any)),
                              api
                                .get("/uomconversion", {
                                  params: { limit: 1, fromCode: c },
                                })
                                .catch(() => ({ data: { data: [] } } as any)),
                              api
                                .get("/uomconversion", {
                                  params: { limit: 1, toCode: c },
                                })
                                .catch(() => ({ data: { data: [] } } as any)),
                              // attempt to check menu items (ingredients) by scanning menu list briefly
                              // NOTE: There's no convenient filter for selected_uom_code - skip heavy checks
                              Promise.resolve({ data: { data: [] } }),
                            ]);

                          const usedInInv =
                            (invRes?.data?.data ?? []).length > 0;
                          const usedInConv =
                            (convFromRes?.data?.data ?? []).length > 0 ||
                            (convToRes?.data?.data ?? []).length > 0;
                          const isUsed = usedInInv || usedInConv;

                          if (!isUsed) {
                            // not used: ask for delete confirmation
                            if (!confirm(`Xóa đơn vị "${u.name}" (${u.code})?`))
                              return;
                            removeMut.mutate({ code: u.code });
                            return;
                          }

                          // is used -> ask if they want to deactivate instead
                          const doDeactivate = confirm(
                            `Đơn vị "${u.name}" (${u.code}) đang được sử dụng ở nơi khác. Bạn có muốn chuyển sang trạng thái ngưng hoạt động thay vì xóa?`
                          );
                          if (!doDeactivate) return;

                          // call delete (backend will either hard-delete or soft-delete -> inactivate)
                          await removeMut.mutateAsync({ code: u.code });
                        } catch (err: any) {
                          toast.error(
                            err?.message ??
                              "Lỗi khi kiểm tra/đổi trạng thái đơn vị"
                          );
                        }
                      }}
                      title="Xóa"
                      disabled={removeMut.isPending || updateMut.isPending}
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
