"use client";

import * as React from "react";
import { useIngredients, type StockFilter } from "@/hooks/admin/useIngredients";
import { useSuppliers } from "@/hooks/admin/useSupplier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import AddIngredientModal from "@/components/admin/inventories/inventory-item/modal/AddIngredientModal";
import EditIngredientModal from "@/components/admin/inventories/inventory-item/modal/EditIngredientModal";
// --- [MỚI] Import thêm các component UI cần thiết ---
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator, // Mới
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  AlertTriangle,
  Trash2,
  Archive,
  Pencil,
  Undo2,
} from "lucide-react"; // Mới
import {
  useDeleteIngredient,
  useRestoreIngredient,
} from "@/hooks/admin/useIngredients";
import { useCategoriesQuery } from "@/hooks/admin/useCategory";
import { useUomsQuery } from "@/hooks/admin/useUnitsOfMeasure";
import { toast } from "sonner";

export default function IngredientsListPage() {
  // Paging + search
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState(search);
  const [statusFilter, setStatusFilter] = React.useState<string>("true");
  const isActiveParam =
    statusFilter === "all" ? undefined : statusFilter === "true";
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Filters
  const [stock, setStock] = React.useState<StockFilter>("ALL");
  const [baseUomCode, setBaseUomCode] = React.useState<string | undefined>();
  const [supplierId, setSupplierId] = React.useState<string | undefined>(
    undefined
  );
  const [categoryId, setCategoryId] = React.useState<string | undefined>(
    undefined
  );

  React.useEffect(
    () => setPage(1),
    [stock, baseUomCode, supplierId, categoryId]
  );

  const fetchLimit = categoryId ? 100 : limit;
  const fetchPage = categoryId ? 1 : page;

  const {
    data: fetchedItems = [],
    meta: fetchedMeta,
    isLoading,
    isFetching,
    refetch,
  } = useIngredients(
    fetchPage,
    fetchLimit,
    debounced,
    stock,
    baseUomCode,
    supplierId,
    isActiveParam
  );

  // suppliers for filter
  const [supplierPage, setSupplierPage] = React.useState(1);
  const [supplierQ, setSupplierQ] = React.useState("");
  const { data: supplierResp, isLoading: isSupplierLoading } = useSuppliers(
    supplierPage,
    10,
    { q: supplierQ } as any
  );

  const suppliers = React.useMemo(() => {
    if (!supplierResp) return [] as any[];
    if (Array.isArray((supplierResp as any).data))
      return (supplierResp as any).data;
    if (Array.isArray((supplierResp as any).data?.data))
      return (supplierResp as any).data.data;
    return [] as any[];
  }, [supplierResp]);

  const supplierTotal =
    (supplierResp as any)?.total ??
    (supplierResp as any)?.meta?.total ??
    (supplierResp as any)?.data?.meta?.total ??
    suppliers.length;

  const supplierPages = Math.max(1, Math.ceil((supplierTotal || 0) / 10));

  const [uomPage, setUomPage] = React.useState(1);
  const { data: uomPageResp, isLoading: isUomLoading } = useUomsQuery({
    page: uomPage,
    limit: 10,
    sortBy: "code",
    sortDir: "ASC",
  });

  const unitOptions = React.useMemo(() => {
    return (uomPageResp?.data ?? []).map((u: any) => ({
      code: u.code,
      name: u.name,
    }));
  }, [uomPageResp]);

  const { displayedIngredients, localMeta } = React.useMemo(() => {
    if (!categoryId) {
      return {
        displayedIngredients: fetchedItems,
        localMeta: fetchedMeta,
      };
    }

    const filtered = (fetchedItems as any[]).filter(
      (it) => it?.category?.id === categoryId
    );
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const current = Math.min(Math.max(1, page), pages);
    const start = (current - 1) * limit;
    const pageItems = filtered.slice(start, start + limit);
    return {
      displayedIngredients: pageItems,
      localMeta: { total, page: current, limit, pages },
    } as any;
  }, [fetchedItems, fetchedMeta, categoryId, page, limit]);

  // Add modal
  const [openAdd, setOpenAdd] = React.useState(false);
  // Edit modal
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editDefaults, setEditDefaults] = React.useState<any | null>(null);

  // --- [MỚI] Logic Xóa & Dialog ---
  const delMut = useDeleteIngredient();
  const restoreMut = useRestoreIngredient();

  // State quản lý Dialog xác nhận xóa
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    isOpen: boolean;
    item: any | null;
    mode: "SOFT" | "HARD"; // SOFT: Ngưng, HARD: Xóa hẳn
  }>({ isOpen: false, item: null, mode: "SOFT" });
  React.useEffect(
    () => setPage(1),
    [stock, baseUomCode, supplierId, categoryId, statusFilter]
  );
  // Mở dialog Soft Delete
  const handleSoftDeleteClick = (item: any) => {
    setDeleteConfirm({ isOpen: true, item, mode: "SOFT" });
  };

  // Mở dialog Hard Delete
  const handleHardDeleteClick = (item: any) => {
    setDeleteConfirm({ isOpen: true, item, mode: "HARD" });
  };

  // Hàm thực hiện xóa
  // Hàm thực hiện xóa
  const confirmDelete = async (force: boolean = false) => {
    if (!deleteConfirm.item) return;
    const { item, mode } = deleteConfirm;

    try {
      if (mode === "HARD") {
        // Hard delete
        await delMut.mutateAsync({ id: item.id, hard: true });
        toast.success("Đã xóa vĩnh viễn nguyên liệu");
      } else {
        // Soft delete
        await delMut.mutateAsync({ id: item.id, force });
        toast.success(
          force
            ? "Đã ngưng sử dụng và xóa tồn kho về 0"
            : "Đã ngưng sử dụng nguyên liệu"
        );
      }
      setDeleteConfirm({ ...deleteConfirm, isOpen: false });
      refetch();
    } catch (error: any) {
      const resData = error?.response?.data;
      const rawMsg = resData?.message || error?.message;

      // --- [SỬA] Bắt lỗi xóa vĩnh viễn để báo chi tiết ---
      if (mode === "HARD" && rawMsg === "CANNOT_HARD_DELETE_ITEM") {
        // Lấy danh sách lý do từ backend gửi về (nếu có)
        // Cấu trúc có thể nằm trong resData.error hoặc resData.response tùy bộ lọc lỗi BE
        const reasons =
          resData?.error?.reasons || resData?.response?.reasons || [];

        let reasonList: string[] = [];
        if (reasons.includes("NON_ZERO_QUANTITY"))
          reasonList.push("Đang còn tồn kho");
        if (reasons.includes("HAS_INVENTORY_TRANSACTIONS"))
          reasonList.push("Đã có lịch sử nhập/xuất kho");
        if (reasons.includes("HAS_PURCHASE_RECEIPT_ITEMS"))
          reasonList.push("Đã từng nhập hàng (có phiếu nhập)");
        if (reasons.includes("USED_IN_MENU_INGREDIENTS"))
          reasonList.push("Đang được dùng trong công thức món");

        // Nếu không parse được lý do cụ thể thì báo chung
        if (reasonList.length === 0)
          reasonList.push("Đã phát sinh dữ liệu liên quan");

        // Hiển thị Toast lỗi chi tiết
        toast.error("Không thể xóa vĩnh viễn!", {
          duration: 6000,
          description: (
            <div className="mt-2 text-sm">
              <p className="mb-1">
                Nguyên liệu <b>{item.name}</b> không thể xóa vì:
              </p>
              <ul className="list-disc list-inside text-red-600 font-medium space-y-1 mb-2">
                {reasonList.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
              <p className="text-gray-600 italic border-t pt-1 mt-1">
                💡 Bạn chỉ có thể chọn <b>Ngưng sử dụng</b>.
              </p>
            </div>
          ),
        });
      } else {
        // Các lỗi khác
        toast.error("Thao tác thất bại", { description: String(rawMsg) });
      }
    }
  };

  const catActive = useCategoriesQuery({
    type: "INGREDIENT",
    page: 1,
    limit: 10,
  });
  const catAny = useCategoriesQuery({ page: 1, limit: 10 });
  const catActiveList = catActive.data?.data ?? [];
  const catAnyList = catAny.data?.data ?? [];
  const catAnyIngredient = catAnyList.filter(
    (c: any) => String(c.type).toUpperCase() === "INGREDIENT"
  );
  const categoriesForModal =
    catActiveList.length > 0
      ? catActiveList
      : catAnyIngredient.length > 0
      ? catAnyIngredient
      : catAnyList;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
      {/* Sidebar filters */}
      <aside className="space-y-4">
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium mb-3">Tồn kho</div>
          <div className="space-y-2 text-sm">
            {(
              [
                ["ALL", "Tất cả"],
                ["BELOW", "Dưới định mức tồn"],
                ["OVER", "Vượt định mức tồn"],
                ["IN_STOCK", "Còn hàng trong kho"],
                ["OUT_OF_STOCK", "Hết hàng trong kho"],
              ] as [StockFilter, string][]
            ).map(([val, label]) => (
              <label
                key={val}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="stock"
                  value={val}
                  checked={stock === val}
                  onChange={() => setStock(val)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div>
        {/* Top bar: search + add + page size */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Skeleton className="h-9 w-80" />
            ) : (
              <Input
                placeholder="Tìm theo tên hoặc đơn vị…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:max-w-md"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setOpenAdd(true)}>+ Thêm Hàng Hóa</Button>
          </div>
        </div>

        {/* Filters row */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 mr-2">Đơn vị</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="border rounded px-2 py-1 text-sm">
                  {unitOptions.find((u) => u.code === baseUomCode)?.name ??
                    baseUomCode ??
                    "Tất cả"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  {isUomLoading ? (
                    <div className="text-sm text-gray-500">Đang tải...</div>
                  ) : (
                    <>
                      <div className="max-h-44 overflow-auto">
                        {unitOptions.length === 0 && (
                          <div className="text-sm text-gray-500">
                            Không có đơn vị
                          </div>
                        )}
                        {unitOptions.map((u: any) => (
                          <button
                            key={u.code}
                            className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded ${
                              baseUomCode === u.code
                                ? "bg-gray-100 font-medium"
                                : ""
                            }`}
                            onClick={() => {
                              setBaseUomCode(u.code);
                              setPage(1);
                            }}
                          >
                            {u.name}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <button
                          className="text-sm text-gray-600"
                          onClick={() => setUomPage((p) => Math.max(1, p - 1))}
                          disabled={(uomPageResp?.meta?.page ?? uomPage) <= 1}
                        >
                          Trước
                        </button>
                        <div className="text-sm text-gray-600">
                          Trang {uomPageResp?.meta?.page ?? uomPage}/
                          {uomPageResp?.meta?.pages ?? 1}
                        </div>
                        <button
                          className="text-sm text-gray-600"
                          onClick={() =>
                            setUomPage((p) =>
                              Math.min(uomPageResp?.meta?.pages ?? p + 1, p + 1)
                            )
                          }
                          disabled={
                            (uomPageResp?.meta?.page ?? uomPage) >=
                            (uomPageResp?.meta?.pages ?? 1)
                          }
                        >
                          Sau
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 mr-2">
                          Danh mục
                        </label>
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={categoryId ?? ""}
                          onChange={(e) => {
                            setCategoryId(e.target.value || undefined);
                            setPage(1);
                          }}
                        >
                          <option value="">Tất cả</option>
                          {categoriesForModal.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-2 text-right">
                        <button
                          className="text-sm text-gray-600"
                          onClick={() => {
                            setBaseUomCode(undefined);
                            setPage(1);
                          }}
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 mr-2">Nhà cung cấp</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="border rounded px-3 py-1 text-sm min-w-[160px] text-left">
                  {suppliers.find((s: any) => s.id === supplierId)?.name ??
                    (supplierId ? supplierId : "Tất cả")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-2">
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Tìm nhà cung cấp..."
                    value={supplierQ}
                    onChange={(e) => {
                      setSupplierQ(e.target.value);
                      setSupplierPage(1);
                    }}
                  />

                  <div className="max-h-44 overflow-auto">
                    {isSupplierLoading ? (
                      <div className="text-sm text-gray-500">Đang tải...</div>
                    ) : suppliers.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        Không có nhà cung cấp
                      </div>
                    ) : (
                      suppliers.map((s: any) => (
                        <button
                          key={s.id}
                          className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-50 rounded ${
                            supplierId === s.id ? "bg-gray-100 font-medium" : ""
                          }`}
                          onClick={() => {
                            setSupplierId(s.id);
                            setPage(1);
                          }}
                        >
                          {s.name}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <button
                      className="text-sm text-gray-600"
                      onClick={() => setSupplierPage((p) => Math.max(1, p - 1))}
                      disabled={supplierPage <= 1}
                    >
                      Trước
                    </button>
                    <div className="text-sm text-gray-600">
                      Trang {supplierPage}/{supplierPages}
                    </div>
                    <button
                      className="text-sm text-gray-600"
                      onClick={() =>
                        setSupplierPage((p) => Math.min(supplierPages, p + 1))
                      }
                      disabled={supplierPage >= supplierPages}
                    >
                      Sau
                    </button>
                  </div>

                  <div className="mt-2 text-right">
                    <button
                      className="text-sm text-gray-600"
                      onClick={() => {
                        setSupplierId(undefined);
                        setPage(1);
                      }}
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 mr-2">Danh mục</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={categoryId ?? ""}
              onChange={(e) => {
                setCategoryId(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {categoriesForModal.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 mr-2">Trạng thái</label>
            <select
              className="border rounded px-2 py-1 text-sm bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã ngưng sử dụng</option>
              <option value="all">Tất cả</option>
            </select>
          </div>

          <div className="ml-auto">
            <button
              className="text-sm text-gray-600 underline"
              onClick={() => {
                setSupplierId(undefined);
                setCategoryId(undefined);
                setStatusFilter("true");
                setSearch("");
                setPage(1);
              }}
            >
              Reset bộ lọc
            </button>
          </div>
        </div>

        {/* Table */}
        <section className="rounded-2xl border overflow-x-auto">
          <table className="min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Đơn vị</th>
                <th className="px-4 py-3">Số lượng</th>
                <th className="px-4 py-3">Ngưỡng cảnh báo</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className={isFetching ? "opacity-70" : undefined}>
              {displayedIngredients.map((i: any) => {
                const low = i.quantity <= i.alertThreshold;
                const isDeleted = i.isDeleted || i.isActive === false; // Check trạng thái

                return (
                  <tr
                    key={i.id}
                    className={`border-t ${
                      isDeleted ? "bg-gray-50 text-gray-400" : ""
                    }`}
                  >
                    <td className="px-4 py-2 font-medium">
                      {i.name}
                      {isDeleted && (
                        <span className="ml-2 text-[10px] bg-gray-200 px-1 rounded border border-gray-300">
                          Ngưng
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">{i.unit}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          isDeleted
                            ? "bg-gray-200"
                            : low
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {i.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-2">{i.alertThreshold}</td>
                    <td
                      className="px-4 py-2 text-gray-600 max-w-[150px] truncate"
                      title={i.description}
                    >
                      {i.description ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {i.category?.name ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs">
                      {i.updatedAt
                        ? new Date(i.updatedAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditId(i.id);
                              setEditDefaults({
                                name: i.name,
                                alertThreshold: i.alertThreshold,
                                description: i.description || "",
                                categoryId: i.category?.id,
                              });
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4 text-gray-500" />
                            Sửa thông tin
                          </DropdownMenuItem>

                          {/* Logic Ngưng / Khôi phục */}
                          {!isDeleted ? (
                            <DropdownMenuItem
                              className="text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                              onClick={() => handleSoftDeleteClick(i)}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Ngưng sử dụng
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                              onClick={async () => {
                                await restoreMut.mutateAsync({ id: i.id });
                                refetch();
                                toast.success("Đã khôi phục hoạt động");
                              }}
                            >
                              <Undo2 className="mr-2 h-4 w-4" />
                              Khôi phục hoạt động
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {/* Nút Xóa vĩnh viễn */}
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={() => handleHardDeleteClick(i)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa dữ liệu vĩnh viễn
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {displayedIngredients.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>
            Trang {localMeta?.page}/{localMeta?.pages} • Tổng {localMeta?.total}{" "}
            bản ghi
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={(localMeta?.page ?? 1) <= 1 || isFetching}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setPage((p) => Math.min(localMeta?.pages ?? p + 1, p + 1))
              }
              disabled={
                (localMeta?.page ?? 1) >= (localMeta?.pages ?? 1) || isFetching
              }
            >
              Sau
            </Button>
          </div>
        </div>

        {/* Add modal */}
        <AddIngredientModal
          open={openAdd}
          onOpenChange={setOpenAdd}
          onSaved={(ing) => {
            setSearch(ing.name);
            setOpenAdd(false);
            refetch();
          }}
        />
        {editId && editDefaults && (
          <EditIngredientModal
            open={!!editId}
            onOpenChange={(v) => {
              if (!v) {
                setEditId(null);
                setEditDefaults(null);
              }
            }}
            id={editId}
            defaults={editDefaults}
            categoriesProp={categoriesForModal as any}
            onSaved={() => refetch()}
          />
        )}

        {/* [MỚI] DIALOG XÁC NHẬN XÓA THÔNG MINH */}
        {/* [MỚI] DIALOG XÁC NHẬN XÓA THÔNG MINH */}
        <AlertDialog
          open={deleteConfirm.isOpen}
          onOpenChange={(open: boolean) => {
            if (!open) setDeleteConfirm({ ...deleteConfirm, isOpen: false });
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {deleteConfirm.mode === "HARD" ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-600">Xóa dữ liệu vĩnh viễn?</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-5 w-5 text-amber-600" />
                    <span>Ngưng sử dụng nguyên liệu?</span>
                  </>
                )}
              </AlertDialogTitle>

              {/* SỬA LỖI Ở ĐÂY: Thêm asChild và bọc nội dung trong div */}
              <AlertDialogDescription asChild>
                <div className="flex flex-col gap-3 pt-2 text-base text-muted-foreground">
                  {deleteConfirm.mode === "HARD" ? (
                    <div className="space-y-2">
                      <p>
                        Hành động này sẽ xóa hoàn toàn nguyên liệu{" "}
                        <strong className="text-foreground">
                          {deleteConfirm.item?.name}
                        </strong>{" "}
                        khỏi hệ thống.
                      </p>
                      <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                        <strong>Lưu ý quan trọng:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>
                            Dữ liệu này <b>không thể khôi phục</b>.
                          </li>
                          <li>
                            Chỉ xóa được nếu chưa có lịch sử nhập/xuất kho.
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p>
                        Bạn đang muốn ngưng sử dụng{" "}
                        <strong className="text-foreground">
                          {deleteConfirm.item?.name}
                        </strong>
                        .
                        <br />
                        Nguyên liệu này sẽ bị ẩn khỏi danh sách chọn, nhưng vẫn
                        được lưu trữ lịch sử trong hệ thống.
                      </p>

                      {deleteConfirm.item?.quantity > 0 && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm mt-2">
                          <div className="flex items-center gap-2 font-semibold mb-1">
                            <AlertTriangle className="h-4 w-4" />
                            Cảnh báo tồn kho
                          </div>
                          <p>
                            Nguyên liệu này hiện vẫn còn tồn kho:{" "}
                            <strong>
                              {deleteConfirm.item?.quantity}{" "}
                              {deleteConfirm.item?.unit}
                            </strong>
                            .
                          </p>
                          <p className="mt-1">
                            Bạn có muốn hệ thống tự động tạo phiếu xuất hủy
                            (Waste) để đưa tồn kho về 0 không?
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-4">
              {/* ... (Phần Footer giữ nguyên không đổi) ... */}
              <AlertDialogCancel>Huỷ bỏ</AlertDialogCancel>

              {deleteConfirm.mode === "HARD" ? (
                <Button
                  variant="destructive"
                  onClick={() => confirmDelete(false)}
                >
                  Xác nhận Xóa vĩnh viễn
                </Button>
              ) : // Logic nút bấm cho Soft Delete
              deleteConfirm.item?.quantity > 0 ? (
                <>
                  <Button
                    variant="outline"
                    className="border-amber-600 text-amber-700 hover:bg-amber-50"
                    onClick={() => confirmDelete(false)}
                  >
                    Giữ tồn kho & Ngưng
                  </Button>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => confirmDelete(true)}
                  >
                    Hủy tồn kho & Ngưng
                  </Button>
                </>
              ) : (
                <Button onClick={() => confirmDelete(false)}>
                  Xác nhận Ngưng
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
