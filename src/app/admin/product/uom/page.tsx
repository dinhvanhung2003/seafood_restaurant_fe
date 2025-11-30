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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import thêm Alert Dialog
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react";
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
  const [sortBy, setSortBy] = useState<"code" | "name" | "dimension" | "none">(
    "none"
  );
  const [sortDir, setSortDir] = useState<"ASC" | "DESC" | "none">("none");
  const [showInactive, setShowInactive] = useState(false);

  // State quản lý dialog xác nhận xóa
  const [deleteConf, setDeleteConf] = useState<{
    isOpen: boolean;
    code: string;
    name: string;
    type: "DELETE" | "DEACTIVATE"; // DELETE: Xóa hẳn, DEACTIVATE: Có ràng buộc, hỏi ngưng hoạt động
    isLoadingCheck: boolean; // Loading khi đang check API
  }>({
    isOpen: false,
    code: "",
    name: "",
    type: "DELETE",
    isLoadingCheck: false,
  });

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
      refetch();
      // Đóng dialog sau khi thành công
      setDeleteConf((prev) => ({ ...prev, isOpen: false }));
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

  const handleVerifyDelete = async (u: { code: string; name: string }) => {
    try {
      setDeleteConf({
        isOpen: false,
        code: u.code,
        name: u.name,
        type: "DELETE",
        isLoadingCheck: true,
      });

      const c = u.code;
      const [invRes, convToRes] = await Promise.all([
        api
          .get("/inventoryitems/list-ingredients", {
            params: { limit: 1, baseUomCode: c },
          })
          .catch(() => ({ data: { data: [] } } as any)),
        api
          .get("/uomconversion", {
            params: { limit: 1, toCode: c },
          })
          .catch(() => ({ data: { data: [] } } as any)),
      ]);

      const usedInInv = (invRes?.data?.data ?? []).length > 0;
      // Chỉ kiểm tra toCode
      const usedInConv = (convToRes?.data?.data ?? []).length > 0;
      const isUsed = usedInInv || usedInConv; // Cập nhật trạng thái dialog

      setDeleteConf({
        isOpen: true,
        code: u.code,
        name: u.name,
        type: isUsed ? "DEACTIVATE" : "DELETE",
        isLoadingCheck: false,
      });
    } catch (err: any) {
      setDeleteConf((prev) => ({ ...prev, isLoadingCheck: false }));
      toast.error(err?.message ?? "Lỗi khi kiểm tra trạng thái đơn vị");
    }
  };

  // Hàm thực thi xóa khi người dùng bấm "Đồng ý" trên Dialog
  const handleConfirmDelete = () => {
    if (!deleteConf.code) return;
    removeMut.mutate({ code: deleteConf.code });
  };

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
        {/* ... (Phần Input tìm kiếm giữ nguyên không đổi) ... */}
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
                      // Sửa logic onClick tại đây: gọi hàm handleVerifyDelete
                      onClick={() => handleVerifyDelete(u)}
                      title="Xóa"
                      disabled={
                        removeMut.isPending ||
                        updateMut.isPending ||
                        (deleteConf.isLoadingCheck &&
                          deleteConf.code === u.code)
                      }
                    >
                      {/* Hiển thị loader nếu đang check đúng dòng này */}
                      {deleteConf.isLoadingCheck &&
                      deleteConf.code === u.code ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
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

      {/* Component Alert Dialog Mới */}
      <AlertDialog
        open={deleteConf.isOpen}
        onOpenChange={(open) => {
          // Nếu đóng modal, reset state
          if (!open) {
            setDeleteConf((prev) => ({ ...prev, isOpen: false }));
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConf.type === "DEACTIVATE"
                ? "Ngưng hoạt động đơn vị?"
                : "Xác nhận xóa đơn vị tính"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConf.type === "DEACTIVATE" ? (
                <>
                  Đơn vị{" "}
                  <span className="font-semibold text-foreground">
                    {deleteConf.name} ({deleteConf.code})
                  </span>{" "}
                  đang được sử dụng trong công thức hoặc quy đổi. <br />
                  Bạn có muốn chuyển sang trạng thái{" "}
                  <span className="font-semibold text-destructive">
                    NGƯNG HOẠT ĐỘNG
                  </span>{" "}
                  thay vì xóa không?
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn xóa đơn vị{" "}
                  <span className="font-semibold text-foreground">
                    {deleteConf.name} ({deleteConf.code})
                  </span>
                  ? <br />
                  Hành động này không thể hoàn tác.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMut.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Ngăn modal tự đóng ngay lập tức để chờ API
                handleConfirmDelete();
              }}
              className={
                deleteConf.type === "DELETE"
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
              }
              disabled={removeMut.isPending}
            >
              {removeMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {deleteConf.type === "DEACTIVATE" ? "Ngưng hoạt động" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
