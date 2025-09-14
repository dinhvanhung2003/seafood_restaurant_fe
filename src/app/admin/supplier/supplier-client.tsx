"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import SidebarSupplierFilter from "@/components/admin/partner/supplier/filter/SideBarSupplierFilter";
import SuppliersTable from "@/components/admin/partner/supplier/table/SuppliterTable";
import { useSuppliers } from "@/hooks/admin/useSupplier";
import type { SuppliersFilter } from "@/types/types";

// modal tải khi cần (giảm JS ban đầu)
const AddSupplierModal = dynamic(
  () => import("@/components/admin/partner/supplier/modal/AddSupplierModal"),
  { ssr: false }
);
const SupplierDetailModal = dynamic(
  () => import("@/components/admin/partner/supplier/modal/SupplierDetailModal"),
  { ssr: false }
);

export default function SuppliersClient({
  initial,
  page: pageFromServer,
  limit,
  defaultFilters,
}: {
  initial: any;              // { items, total, page, limit }
  page: number;
  limit: number;
  defaultFilters: SuppliersFilter;
}) {
  const [page, setPage] = useState(pageFromServer ?? 1);
  const [filters, setFilters] = useState<SuppliersFilter>(defaultFilters);

  // Modal states
  const [openAdd, setOpenAdd] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailId, setDetailId] = useState<string | undefined>();

  // React Query: dùng initialData để render ngay, lần sau refetch nhẹ
  const { data, isLoading } = useSuppliers(page, limit, filters, initial);

  return (
    <div className="flex">
      <aside className="border-r">
        <SidebarSupplierFilter filters={filters} onChange={setFilters} />
      </aside>

      <main className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Nhà cung cấp</h2>
          <Button onClick={() => setOpenAdd(true)}>+ Nhà cung cấp</Button>
        </div>

        {isLoading ? (
          <div className="animate-pulse h-40 rounded-md border bg-muted" />
        ) : (
          <SuppliersTable
            data={data?.items ?? []}
            onRowClick={(id) => {
              setDetailId(id);
              setOpenDetail(true);
            }}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <Button
            variant="outline"
            disabled={page * limit >= (data?.total ?? 0)}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      </main>

      <AddSupplierModal open={openAdd} onOpenChange={setOpenAdd} />

      <SupplierDetailModal
        open={openDetail}
        onOpenChange={(v) => {
          setOpenDetail(v);
          if (!v) setDetailId(undefined);
        }}
        id={detailId}
      />
    </div>
  );
}
