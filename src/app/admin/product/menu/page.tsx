"use client";
import { useMemo, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useMenuItemsQuery } from "@/hooks/admin/useMenu";
export type MenuItemsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isAvailable?: string; // "true" | "false"
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
  const body = data?.body;

  // Pagination fallback: backend might return all items in a single page.
  const allItems = body?.data ?? [];

  // Remove combo items from this page as requested: do not display items
  // where `isCombo` is true.
  const filteredAllItems = allItems.filter((it: any) => !it.isCombo);
  const returnedAllInOne =
    (body?.meta?.totalPages ?? 1) === 1 && filteredAllItems.length > limit;
  // Use filtered counts (without combos) for UI pagination/total
  const totalItems = filteredAllItems.length ?? 0;
  const pages =
    body?.meta?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit));
  const pageItems = returnedAllInOne
    ? filteredAllItems.slice((page - 1) * limit, page * limit)
    : filteredAllItems;

  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const del = useDeleteMenuItemMutation();

  // Keep page in valid range if `pages` changes
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  // use derived values rather than values from response when necessary
  // (re-declared above)
  // const pages = body?.meta.totalPages ?? 1;
  const total = totalItems;

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
        page={Math.min(page, pages)}
        pages={pages}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error ?? null}
        isPlaceholderData={!!isPlaceholderData}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(pages, p + 1))}
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
