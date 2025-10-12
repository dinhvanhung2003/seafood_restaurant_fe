"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAreas,
  useCreateArea,
  useTablesQuery,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
} from "@/hooks/admin/useTable";
import AreaFormModal from "@/components/admin/table/modal/AreaFormModal";
import TableFormModal, { TableFormState, Area as TableArea } from "@/components/admin/table/modal/TableFormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppToast } from "@/lib/toast";
import type { DiningTableDTO } from "@/types/admin/table/table";

type ModalStatus = "active" | "inactive";
type ApiStatus = "ACTIVE" | "INACTIVE";

export const toApiStatus = (s: ModalStatus): ApiStatus =>
  s === "active" ? "ACTIVE" : "INACTIVE";

export const toModalStatus = (s: ApiStatus): ModalStatus =>
  s === "ACTIVE" ? "active" : "inactive";

export default function TablesPage() {
  const toast = useAppToast();

  // filters + paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [areaName, setAreaName] = useState<string>(""); // lọc theo tên khu
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ALL");
  // fetch areas (để hiện select trong modal và filter "theo tên khu")
  const { data: areasData = [] } = useAreas();
  const areaOptions: TableArea[] = useMemo(
    () => areasData.map((a) => ({ id: a.id, name: a.name })),
    [areasData]
  );

  // fetch tables (server paging)
  const { data: tableResp, isFetching, error } = useTablesQuery(
    {
      page, 
      limit, 
      area: areaName || undefined, 
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
    });
  const tables = tableResp?.items ?? [];
  const meta = tableResp?.meta ?? { total: 0, page, limit, pages: 1 };

  // mutations
  const createArea = useCreateArea();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  // modals state
  const [openAreaModal, setOpenAreaModal] = useState(false);
  const [openTableModal, setOpenTableModal] = useState(false);
  const [tableEditing, setTableEditing] = useState(false);
  const [form, setForm] = useState<TableFormState>({
    name: "", areaId: "", seats: 2, note: "", status: "active", order: 0,
  });

  // reset page khi filter đổi
  useEffect(() => { setPage(1); }, [areaName, search, limit]);

  const onOpenCreateArea = () => { setOpenAreaModal(true); };
  const onOpenCreateTable = () => {
    setTableEditing(false);
    setForm({ name: "", areaId: "", seats: 2, note: "", status: "active", order: 0 });
    setOpenTableModal(true);
  };
  const onOpenEditTable = (t: DiningTableDTO) => {
    setTableEditing(true);
    setForm({
      id: t.id,
      name: t.name,
      areaId: t.area.id,
      seats: t.seats,
      note: t.note ?? "",
      status: toModalStatus(t.status),
      order: t.order ?? 0,
    });
    setOpenTableModal(true);
  };

  // submit area
  const handleSubmitArea = () => {
    createArea.mutate(
      { name: form.name, note: "", status: "AVAILABLE" }, // bạn có thể dùng state riêng cho area modal như trước
      {
        onSuccess: (a) => { toast.success("Đã tạo khu vực", a.name); setOpenAreaModal(false); },
        onError: () => toast.error("Không tạo được khu vực"),
      }
    );
  };

  // submit table
  const handleSubmitTable = () => {
    if (!form.name.trim() || !form.areaId) return;
    const payload = {
      name: form.name.trim(),
      seats: Number(form.seats ?? 2) || 2,
      note: form.note || undefined,
      areaId: form.areaId,
      status: toApiStatus(form.status),
    };
    if (tableEditing && form.id) {
      updateTable.mutate(
        { args: { id: form.id }, data: payload },
        {
          onSuccess: () => { toast.success("Đã cập nhật bàn", form.name); setOpenTableModal(false); },
          onError: () => toast.error("Không cập nhật được bàn"),
        }
      );
    } else {
      createTable.mutate(payload, {
        onSuccess: () => { toast.success("Đã tạo bàn", form.name); setOpenTableModal(false); },
        onError: () => toast.error("Không tạo được bàn"),
      });
    }
  };

  // delete
  const handleDelete = (t: DiningTableDTO) => {
    if (!confirm(`Xoá bàn "${t.name}"?`)) return;
    deleteTable.mutate(
      { id: t.id },
      { onSuccess: () => toast.success("Đã xoá bàn", t.name), onError: () => toast.error("Không xoá được bàn") }
    );
  };

  const busy = isFetching || createArea.isPending || createTable.isPending || updateTable.isPending || deleteTable.isPending;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh sách bàn</h1>
        {busy && <span className="text-xs text-muted-foreground animate-pulse">Đang xử lý…</span>}
      </header>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label>Tìm kiếm</Label>
          <Input placeholder="Tên bàn…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <Label>Khu vực (lọc theo tên)</Label>
          <Select value={areaName} onValueChange={(v) => setAreaName(v === "__all__" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả</SelectItem>
              {areaOptions.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Hiển thị</Label>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}/trang</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 rounded-lg border p-3">
  <Label className="text-sm font-medium">Trạng thái</Label>
  <RadioGroup
    value={status}
    onValueChange={(v) => setStatus(v as "ACTIVE" | "INACTIVE" | "ALL")}
    className="mt-1 space-y-2"
  >
    <div className="flex items-center space-x-2">
      <RadioGroupItem id="st-active" value="ACTIVE" />
      <Label htmlFor="st-active">Đang hoạt động</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem id="st-inactive" value="INACTIVE" />
      <Label htmlFor="st-inactive">Ngừng hoạt động</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem id="st-all" value="ALL" />
      <Label htmlFor="st-all">Tất cả</Label>
    </div>
  </RadioGroup>
</div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onOpenCreateArea} className="bg-black hover:opacity-90">+ Tạo khu vực</Button>
        <Button variant="outline" onClick={onOpenCreateTable}>+ Tạo bàn</Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[28%]">Tên bàn</TableHead>
              <TableHead className="w-[22%]">Khu vực</TableHead>
              <TableHead className="w-[14%]">Ghế</TableHead>
              <TableHead className="w-[14%]">Trạng thái</TableHead>
              <TableHead className="w-[22%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-red-600">{String((error as any)?.message || "Có lỗi xảy ra")}</TableCell></TableRow>
            ) : tables.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (
              tables.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.area?.name ?? "—"}</TableCell>
                  <TableCell>{t.seats}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"
                      }`}>{t.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => onOpenEditTable(t)}>Sửa</Button>
                      <Button variant="destructive" onClick={() => handleDelete(t)}>Xoá</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Tổng {meta.total} bàn · Trang {meta.page}/{meta.pages || 1}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || isFetching}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Trước
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(meta.pages || 1, p + 1))} disabled={page >= (meta.pages || 1) || isFetching}>
            Sau <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <AreaFormModal
        open={openAreaModal}
        setOpen={setOpenAreaModal}
        areaName={""} setAreaName={() => { }}
        areaNote={""} setAreaNote={() => { }}
        onSubmit={handleSubmitArea}
      />
      <TableFormModal
        open={openTableModal}
        setOpen={setOpenTableModal}
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmitTable}
        areas={areaOptions}
        editing={tableEditing}
      />
    </div>
  );
}
