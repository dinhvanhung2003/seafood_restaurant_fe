"use client";
import AreaFormModal from "@/components/admin/table/modal/AreaFormModal";
import ExcelDataIO from "@/utils/ExcelDataIO";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import TableFilters from '@/components/admin/table/filter/TableFilters'
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Plus, Pencil, Trash2, Upload, Download } from "lucide-react";
import TableFormModal,  {TableFormState}  from "@/components/admin/table/modal/TableFormModal";

// ================== types ==================
type Status = "active" | "inactive";

type Area = {
  id: string;
  name: string; // VD: "Lầu 1", "Sân vườn"
};

type DiningTable = {
  id: string;
  name: string;    // VD: "Bàn 1"
  areaId: string;  // FK đến Area
  seats?: number;
  note?: string;
  status: Status;
  order?: number;  // số thứ tự hiển thị
};

// ================== storage helpers ==================
const AREAS_KEY = "kv.areas";
const TABLES_KEY = "kv.tables";

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function safeSet<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

// khởi tạo mock data lần đầu
function ensureSeed() {
  const has = localStorage.getItem(TABLES_KEY);
  if (has) return;

  const areas: Area[] = [
    { id: "a1", name: "Lầu 1" },
    { id: "a2", name: "Lầu 2" },
    { id: "a3", name: "Lầu 3" },
  ];
  const tables: DiningTable[] = Array.from({ length: 30 }).map((_, i) => {
    const idx = i + 1;
    const area = idx <= 10 ? "a1" : idx <= 20 ? "a2" : "a3";
    return {
      id: `t${idx}`,
      name: `Bàn ${idx}`,
      areaId: area,
      seats: 0,
      note: "",
      status: "active" as Status,
      order: idx,
    };
  });

  safeSet(AREAS_KEY, areas);
  safeSet(TABLES_KEY, tables);
}


function emptyForm(areas: Area[]): TableFormState {
  return {
    name: "",
    areaId: areas[0]?.id || "",
    seats: 0,
    note: "",
    status: "active",
    order: 0,
  };
}

// ================== main page ==================
export default function PhongBanAdminPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);

  // filters
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("active");
  const [q, setQ] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiningTable | null>(null);
  const [form, setForm] = useState<TableFormState>(emptyForm([]));


    // add area
    const [showAddArea, setShowAddArea] = useState(false);
    const [areaName, setAreaName] = useState("");
    const [areaNote, setAreaNote] = useState("");

    // xử lý thêm khu vực  
    const handleAddArea = () => {
  if (!areaName.trim()) {
    alert("Vui lòng nhập tên khu vực");
    return;
  }

  const newArea: Area = {
    id: `a${Date.now()}`,
    name: areaName.trim(),
  };

  const next = [...areas, newArea];
  setAreas(next);
  safeSet(AREAS_KEY, next);

  // reset
  setAreaName("");
  setAreaNote("");
  setShowAddArea(false);
};








  // init
  useEffect(() => {
    ensureSeed();
    setAreas(safeGet<Area[]>(AREAS_KEY, []));
    setTables(safeGet<DiningTable[]>(TABLES_KEY, []));
  }, []);

  // keep form default area when areas loaded
  useEffect(() => {
    if (!editing && areas.length) setForm(emptyForm(areas));
  }, [areas, editing]);

  // derived: map areaId -> name
  const areaMap = useMemo(() => {
    const m = new Map<string, string>();
    areas.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [areas]);

  // filter + search + sort
  const filtered = useMemo(() => {
    let list = [...tables];

    if (areaFilter !== "all") {
      list = list.filter((t) => t.areaId === areaFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(k) || (t.note || "").toLowerCase().includes(k));
    }
    // sort by area name > order > name
    list.sort((a, b) => {
      const an = areaMap.get(a.areaId) || "";
      const bn = areaMap.get(b.areaId) || "";
      if (an !== bn) return an.localeCompare(bn, "vi");
      const ao = a.order ?? 0, bo = b.order ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, "vi");
    });
    return list;
  }, [tables, areaFilter, statusFilter, q, areaMap]);

  // paging
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    // nếu filter/search thay đổi, quay về trang 1 tránh rỗng
    setPage(1);
  }, [areaFilter, statusFilter, q]);

  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // CRUD
  const saveTables = (next: DiningTable[]) => {
    setTables(next);
    safeSet(TABLES_KEY, next);
  };

  const onCreate = () => {
    setEditing(null);
    setForm(emptyForm(areas));
    setOpen(true);
  };

  const onEdit = (row: DiningTable) => {
    setEditing(row);
    setForm({
      id: row.id,
      name: row.name,
      areaId: row.areaId,
      seats: row.seats ?? 0,
      note: row.note ?? "",
      status: row.status,
      order: row.order ?? 0,
    });
    setOpen(true);
  };

  const onDelete = (row: DiningTable) => {
    if (!confirm(`Xóa ${row.name}?`)) return;
    saveTables(tables.filter((t) => t.id !== row.id));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      alert("Vui lòng nhập tên bàn");
      return;
    }
    if (!form.areaId) {
      alert("Chọn khu vực");
      return;
    }

    if (editing) {
      const next = tables.map((t) =>
        t.id === editing.id
          ? {
              ...t,
              name: form.name.trim(),
              areaId: form.areaId,
              seats: Number(form.seats) || 0,
              note: form.note?.trim() || "",
              status: form.status,
              order: Number(form.order) || 0,
            }
          : t
      );
      saveTables(next);
    } else {
      const id = `t${Date.now()}`;
      const next: DiningTable = {
        id,
        name: form.name.trim(),
        areaId: form.areaId,
        seats: Number(form.seats) || 0,
        note: form.note?.trim() || "",
        status: form.status,
        order: Number(form.order) || 0,
      };
      saveTables([next, ...tables]);
    }
    setOpen(false);
  };






  





const normalizeStatus = (s: any): Status =>
  s === "inactive" || s === 0 || s === false || `${s}`.toLowerCase() === "inactive"
    ? "inactive"
    : "active";


  // =============== UI ===============
return (
  <div className="mx-auto max-w-[1200px] p-4">
    {/* Header */}
    <div className="flex items-center justify-between gap-3">
      <div className="text-2xl font-semibold">Phòng/Bàn</div>
      <div className="flex items-center gap-2">
       <ExcelDataIO
  data={tables}
  fileName="ban.xlsx"
  onImport={(rows: any[]) => {
    if (!Array.isArray(rows)) {
      alert("File không hợp lệ");
      return;
    }

    // map -> đúng kiểu DiningTable
    const mappedTables: DiningTable[] = rows.map((t: any, index: number) => ({
      id: `t${Date.now()}_${index}`,
      name: String(t.name ?? t.ten ?? t["Tên"] ?? "").trim(),
      areaId: String(t.areaId ?? t["areaId"] ?? areas[0]?.id ?? ""),
      seats: Number(t.seats ?? t["Số ghế"] ?? 0) || 0,
      note: String(t.note ?? t.ghiChu ?? t["Ghi chú"] ?? ""),
      status: normalizeStatus(t.status),
      order: Number(t.order ?? t.stt ?? t["Số thứ tự"] ?? 0) || 0,
    }));

    // gộp và set với kiểu chuẩn
    const combined: DiningTable[] = [...tables, ...mappedTables];
    setTables(combined);
    safeSet("kv.tables", combined);
  }}
/>

        <Button onClick={onCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Thêm phòng/bàn
        </Button>
      </div>
    </div>

    <Separator className="my-4" />

    {/* Main content: Filter + Table */}
    <div className="flex flex-col md:flex-row gap-6">
      {/* FILTER bên trái */}
      <aside className="w-full md:w-[280px] space-y-4">
       <TableFilters
  areaFilter={areaFilter}
  setAreaFilter={setAreaFilter}
  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}
  q={q}
  setQ={setQ}
  areas={areas}
  total={filtered.length}
  setShowAddArea={setShowAddArea} 
/>

      </aside>

      {/* TABLE bên phải */}
      <section className="flex-1 overflow-auto">
        <div className="rounded-lg border overflow-x-auto bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Tên phòng/bàn</TableHead>
                <TableHead className="w-[160px]">Khu vực</TableHead>
                <TableHead className="w-[90px] text-center">Số ghế</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="w-[140px] text-center">Trạng thái</TableHead>
                <TableHead className="w-[110px] text-center">Số thứ tự</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{areaMap.get(t.areaId) || "-"}</TableCell>
                  <TableCell className="text-center">{t.seats ?? 0}</TableCell>
                  <TableCell className="truncate max-w-[360px]">{t.note || "-"}</TableCell>
                  <TableCell className="text-center">
                    {t.status === "active" ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">Đang hoạt động</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-400 hover:bg-slate-400 text-white">
                        Ngừng hoạt động
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{t.order ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onEdit(t)}>
                        <Pencil className="mr-1 h-4 w-4" /> Sửa
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(t)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-10">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            Hiển thị <b>{pageData.length}</b> / {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
            <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
            <div className="px-2">Trang {page} / {totalPages}</div>
            <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</Button>
            <Button size="sm" variant="secondary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</Button>
          </div>
        </div>
      </section>
    </div>

    {/* Modal add/edit */}
    <TableFormModal
  open={open}
  setOpen={setOpen}
  form={form}
  setForm={setForm}
  handleSubmit={handleSubmit}
  areas={areas}
  editing={!!editing}
/>
<AreaFormModal
  open={showAddArea}
  setOpen={setShowAddArea}
  areaName={areaName}
  setAreaName={setAreaName}
  areaNote={areaNote}
  setAreaNote={setAreaNote}
  onSubmit={handleAddArea}
/>


  </div>
);

}
