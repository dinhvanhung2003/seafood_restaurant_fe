"use client";

import React, { useMemo, useState } from "react";
import {
  useAreas,
  useCreateArea,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
  AreaDTO,
  DiningTableDTO,
  TableStatusApi,
} from "@/features/admin/table/api";
import AreaFormModal from "@/components/admin/table/modal/AreaFormModal";
import TableFormModal, {
  TableFormState,
  Area as TableArea,
} from "@/components/admin/table/modal/TableFormModal";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/lib/toast";
/* ===== Helpers: map status giữa Modal <-> API ===== */
const toApiStatus = (s: "active" | "inactive"): TableStatusApi =>
  s === "active" ? "ACTIVE" : "INACTIVE";
const toModalStatus = (s: TableStatusApi): "active" | "inactive" =>
  s === "ACTIVE" ? "active" : "inactive";

export default function TablesPage() {



 const toast = useAppToast();

  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [pageSize] = useState(200);

  // ===== Queries
  const {
    data: areasData,
    isLoading: areasLoading,
    error: areasError,
  } = useAreas();

  const areas = (areasData ?? []) as AreaDTO[];

  // Chuẩn hoá bảng: backend có thể không set areaId cho từng bàn, ta gán fallback = id khu vực
  const normalizedAreas = useMemo(
    () =>
      areas.map((a) => ({
        ...a,
        tables: (a.tables ?? []).map((t) => ({
          ...t,
          areaId: t.areaId || a.id,
        })),
      })),
    [areas]
  );

  // Danh sách khu vực cho modal tạo/sửa bàn
  const tableAreas: TableArea[] = normalizedAreas.map((a) => ({
    id: a.id,
    name: a.name,
  }));

  // Lọc theo khu vực + ô tìm kiếm, và cắt trang
  const filteredAreas = useMemo(() => {
    const matchName = (t: DiningTableDTO) =>
      !search ||
      t.name.toLowerCase().includes(search.trim().toLowerCase());

    const matchArea = (a: AreaDTO) =>
      !selectedAreaId || a.id === selectedAreaId;

    return normalizedAreas
      .filter(matchArea)
      .map((a) => ({
        ...a,
        tables: a.tables.filter(matchName).slice(0, pageSize),
      }))
      .filter((a) => a.tables.length > 0 || selectedAreaId === a.id);
  }, [normalizedAreas, selectedAreaId, search, pageSize]);

  // ===== Mutations
  const createArea = useCreateArea();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  // ===== Modals state
  const [openAreaModal, setOpenAreaModal] = useState(false);
  const [openTableModal, setOpenTableModal] = useState(false);

  // Area modal fields
  const [areaName, setAreaName] = useState("");
  const [areaNote, setAreaNote] = useState("");

  // Table modal fields (tạo + sửa)
  const [tableEditing, setTableEditing] = useState(false);
  const [tableForm, setTableForm] = useState<TableFormState>({
    name: "",
    areaId: "",
    seats: 2,
    note: "",
    status: "active",
    order: 0,
  });

  // ===== Handlers mở modal
  const onOpenCreateArea = () => {
    setAreaName("");
    setAreaNote("");
    setOpenAreaModal(true);
  };

  const onOpenCreateTable = () => {
    setTableEditing(false);
    setTableForm({
      name: "",
      areaId: selectedAreaId || "",
      seats: 2,
      note: "",
      status: "active",
      order: 0,
    });
    setOpenTableModal(true);
  };

  const onOpenEditTable = (t: DiningTableDTO) => {
    setTableEditing(true);
    setTableForm({
      id: t.id,
      name: t.name,
      areaId: t.areaId,
      seats: t.seats,
      note: t.note ?? "",
      status: toModalStatus(t.status),
      order: t.order ?? 0,
    });
    setOpenTableModal(true);
  };

  // ===== Submit Area
   const handleSubmitArea = () => {
    if (!areaName.trim()) return;
    createArea.mutate(
      { name: areaName.trim(), note: areaNote || undefined, status: "AVAILABLE" },
      {
        onSuccess: (a) => {
          toast.success("Đã tạo khu vực", a.name);
          setOpenAreaModal(false);
          setSelectedAreaId(a.id);
          setTableForm((f) => ({ ...f, areaId: a.id }));
        },
        onError: () => toast.error("Không tạo được khu vực"),
      }
    );
  };
  // ===== Submit Table (tạo/sửa)
  const handleSubmitTable = () => {
    if (!tableForm.name.trim() || !tableForm.areaId) return;
    const payload = {
      name: tableForm.name.trim(),
      seats: Number(tableForm.seats ?? 2) || 2,
      note: tableForm.note || undefined,
      areaId: tableForm.areaId,
      status: toApiStatus(tableForm.status),
    };

    if (tableEditing && tableForm.id) {
      updateTable.mutate(
        { id: tableForm.id, body: payload },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật bàn", tableForm.name);
            setOpenTableModal(false);
          },
          onError: () => toast.error("Không cập nhật được bàn"),
        }
      );
    } else {
      createTable.mutate(payload, {
        onSuccess: () => {
          toast.success("Đã tạo bàn", tableForm.name);
          setOpenTableModal(false);
        },
        onError: () => toast.error("Không tạo được bàn"),
      });
    }
  };

  // ===== Delete
  const handleDelete = (t: DiningTableDTO) => {
    if (confirm(`Xoá bàn "${t.name}"?`)) {
      deleteTable.mutate(t.id, {
        onSuccess: () => toast.success("Đã xoá bàn", t.name),
        onError: () => toast.error("Không xoá được bàn"),
      });
    }
  };

  // ===== Busy/Error
  const busy =
    areasLoading ||
    createArea.isPending ||
    createTable.isPending ||
    updateTable.isPending ||
    deleteTable.isPending;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bàn &amp; Khu vực</h1>
        </div>
        <div className="flex gap-2">
          {busy && (
            <span className="animate-pulse text-xs text-gray-500">
              Đang xử lý…
            </span>
          )}
          {areasError && (
            <span className="text-xs text-red-600">
              {String((areasError as any)?.message || "Có lỗi xảy ra")}
            </span>
          )}
        </div>
      </header>

      {/* Filters */}
      <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">Khu vực</label>
          <select
            className="w-full rounded-lg border p-2"
            value={selectedAreaId}
            onChange={(e) => {
              setSelectedAreaId(e.target.value);
              setTableForm((f) => ({ ...f, areaId: e.target.value }));
            }}
          >
            <option value="">Tất cả</option>
            {normalizedAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">Tìm kiếm</label>
          <input
            className="w-full rounded-lg border p-2"
            placeholder="Tên bàn…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-span-1 flex items-end gap-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setSelectedAreaId("");
              setSearch("");
            }}
          >
            Xoá bộ lọc
          </Button>
        </div>
      </section>

      {/* Action buttons */}
      <section className="mb-4 flex flex-wrap gap-2">
        <Button onClick={onOpenCreateArea} className="bg-black hover:opacity-90">
          + Tạo khu vực
        </Button>
        <Button variant="outline" onClick={onOpenCreateTable}>
          + Tạo bàn
        </Button>
      </section>

      {/* Area -> Tables */}
      <section className="space-y-6">
        {filteredAreas.map((area) => (
          <div key={area.id} className="rounded-2xl border">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-medium">{area.name}</h2>
              <span className="text-sm text-gray-500">
                Bàn: {area.tables.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3">Tên</th>
                    <th className="px-4 py-3">Ghế</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {area.tables.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="px-4 py-2">{t.name}</td>
                      <td className="px-4 py-2">{t.seats}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            t.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => onOpenEditTable(t)}>
                            Sửa
                          </Button>
                          <Button variant="destructive" onClick={() => handleDelete(t)}>
                            Xoá
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {area.tables.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                        Không có bàn
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredAreas.length === 0 && (
          <div className="rounded-2xl border p-8 text-center text-gray-500">
            Không có dữ liệu
          </div>
        )}
      </section>

      {/* ====== Modals ====== */}
      <AreaFormModal
        open={openAreaModal}
        setOpen={setOpenAreaModal}
        areaName={areaName}
        setAreaName={setAreaName}
        areaNote={areaNote}
        setAreaNote={setAreaNote}
        onSubmit={handleSubmitArea}
      />

      <TableFormModal
        open={openTableModal}
        setOpen={setOpenTableModal}
        form={tableForm}
        setForm={setTableForm}
        handleSubmit={handleSubmitTable}
        areas={tableAreas}
        editing={tableEditing}
      />
    </div>
  );
}
