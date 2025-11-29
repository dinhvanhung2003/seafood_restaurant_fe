"use client";
import { useMemo, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useMenuItemsQuery } from "@/hooks/admin/useMenu";

// 1. Cập nhật Type cho khớp với BE
// Bạn có thể cần sửa type này trong file gốc (ví dụ: @/types/...) nếu nó được import từ nơi khác
// Ở đây tôi define tạm để bạn thấy sự thay đổi
type MenuItemsResponse = {
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number; // <--- Backend trả về 'pages', không phải 'totalPages'
  };
};

export type MenuItemsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isAvailable?: string;
  isCombo?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sortBy?: "name" | "price" | "createdAt";
  order?: "ASC" | "DESC";
};

import MenuFilters from "@/components/admin/product/menu/filter/MenuFilter";
import MenuTable from "@/components/admin/product/menu/table/MenuTable";
import MenuItemDetailDialog from "@/components/admin/product/menu/modal/MenuItemDetalDialog";
import CreateMenuItemDialog from "@/components/admin/product/menu/modal/CreateMenuModal";
import { useDeleteMenuItemMutation } from "@/hooks/admin/useMenu";

export default function MenuItemsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 1000);

  const [isAvailable, setIsAvailable] = useState<"all" | "true" | "false">(
    "all"
  );
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<MenuItemsQuery["sortBy"]>("name");
  const [order, setOrder] = useState<MenuItemsQuery["order"]>("ASC");

  const params = useMemo<MenuItemsQuery>(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      isAvailable: isAvailable === "all" ? undefined : isAvailable,
      isCombo: "false",
      minPrice: minPrice === "" ? undefined : Number(minPrice),
      maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
      sortBy,
      order,
    }),
    [
      page,
      limit,
      debouncedSearch,
      isAvailable,
      minPrice,
      maxPrice,
      sortBy,
      order,
    ]
  );

  const { data, isLoading, isFetching, error, refetch, isPlaceholderData } =
    useMenuItemsQuery(params);

  // Ép kiểu body về dạng đúng nếu TypeScript báo lỗi, hoặc sửa trong hook
  const body = data?.body as unknown as MenuItemsResponse;

  const pageItems = body?.data ?? [];
  const total = body?.meta?.total ?? 0;

  // --- SỬA QUAN TRỌNG Ở ĐÂY ---
  // Backend trả về `pages`, trước đây code dùng `totalPages` nên bị undefined => mặc định về 1
  const totalPages = body?.meta?.pages ?? 1;

  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const del = useDeleteMenuItemMutation();

  // Giữ page hợp lệ nếu pages thay đổi
  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Thực đơn</h2>
      <MenuFilters
        search={search}
        setSearch={setSearch}
        isAvailable={isAvailable}
        setIsAvailable={setIsAvailable}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sortBy={sortBy!}
        setSortBy={(v) => setSortBy(v)}
        order={order!}
        setOrder={(v) => setOrder(v)}
        setPage={setPage}
      />

      <MenuTable
        data={pageItems}
        total={total}
        page={page}
        pages={totalPages} // Truyền đúng số trang lấy từ biến đã sửa
        isLoading={isLoading}
        isFetching={isFetching}
        error={error ?? null}
        isPlaceholderData={!!isPlaceholderData}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        onRefresh={() => refetch()}
        onOpenDetail={(id) => setDetailId(id)}
        onDelete={(id) => del.mutate(id)}
        CreateButton={<CreateMenuItemDialog onCreated={() => refetch()} />}
      />

      <MenuItemDetailDialog
        id={detailId}
        open={Boolean(detailId)}
        onOpenChange={(v) => !v && setDetailId(undefined)}
      />
    </div>
  );
}
