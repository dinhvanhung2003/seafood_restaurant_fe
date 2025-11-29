"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCombosQuery, useDeleteComboMutation } from "@/hooks/admin/useCombo";
import ComboTable from "@/components/admin/product/menu/combo/ComboTable";
import ComboDetailDialog from "@/components/admin/product/menu/combo/ComboDetailDialog";
import ComboCreateDialog from "@/components/admin/product/menu/combo/CreateComboDialog";
import ComboUpdateDialog from "@/components/admin/product/menu/combo/ComboUpdateDialog";
import { Search, X, Plus, RotateCcw } from "lucide-react";

export default function ComboPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  // --- STATE LỌC (Chỉ còn tìm kiếm) ---
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset về trang 1 khi từ khóa thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Query dữ liệu (Bỏ params giá)
  const q = useCombosQuery({
    page,
    limit,
    search: debouncedSearch,
    // Đã bỏ priceMin, priceMax
  });

  const del = useDeleteComboMutation();

  // State Dialogs
  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [openCreate, setOpenCreate] = useState(false);

  const pages = q.data?.totalPages ?? 1;
  const total = q.data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Combo</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách các combo đang kinh doanh
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
          >
            <RotateCcw
              className={`mr-2 h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tạo combo
          </Button>
        </div>
      </div>

      {/* --- THANH TÌM KIẾM (Gọn gàng hơn) --- */}
      <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên combo..."
            className="pl-9 pr-9 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black p-1"
              title="Xóa tìm kiếm"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* --- BẢNG DỮ LIỆU --- */}
      <ComboTable
        data={q.data?.data}
        total={total}
        page={q.data?.page ?? page}
        pages={pages}
        isLoading={q.isLoading}
        isFetching={q.isFetching}
        error={q.error ?? null}
        isPlaceholderData={!!q.isPlaceholderData}
        // Pagination
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pages, p + 1))}
        onRefresh={() => q.refetch()}
        // Actions
        onOpenDetail={(id) => setDetailId(id)}
        onEdit={(id) => setEditId(id)}
        onDelete={(id) => del.mutate(id, { onSuccess: () => q.refetch() })}
        CreateButton={null}
      />

      {/* --- DIALOGS --- */}
      {detailId && (
        <ComboDetailDialog
          id={detailId}
          open
          onOpenChange={(v) => !v && setDetailId(undefined)}
        />
      )}

      {editId && (
        <ComboUpdateDialog
          id={editId}
          open
          onOpenChange={(v) => !v && setEditId(undefined)}
          onUpdated={() => q.refetch()}
        />
      )}

      <ComboCreateDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={() => q.refetch()}
      />
    </div>
  );
}
