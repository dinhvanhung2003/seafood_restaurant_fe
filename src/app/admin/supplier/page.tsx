// app/(admin)/suppliers/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
// 👇 đúng path + đúng tên file xuất
import SuppliersTable from "@/components/admin/partner/supplier/table/SupplierTable";
import SidebarSupplierFilter from "@/components/admin/partner/supplier/filter/SideBarSupplierFilter";
import { useSuppliers } from "@/hooks/admin/useSupplier";
import type { SuppliersFilter } from "@/types/types";
import AddSupplierModal from "@/components/admin/partner/supplier/modal/AddSupplierModal";
import SupplierDetailModal from "@/components/admin/partner/supplier/modal/SupplierDetailModal";

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [open, setOpen] = useState(false);

  const [detailId, setDetailId] = useState<string | undefined>();
  const [openDetail, setOpenDetail] = useState(false);

  const [filters, setFilters] = useState<SuppliersFilter>({
    q: "",
    status: "",
    supplierGroupId: "",
    city: "",
    withGroup: false,
  });

  const { data, isLoading } = useSuppliers(page, limit, filters);

  return (
    <div className="flex">
      <aside className="border-r">
        <SidebarSupplierFilter filters={filters} onChange={setFilters} />
      </aside>

      <main className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Nhà cung cấp</h2>
          <Button onClick={() => setOpen(true)}>+ Nhà cung cấp</Button>
        </div>

        {isLoading ? (
          <div>Đang tải…</div>
        ) : (
          <SuppliersTable
            data={data?.data ?? []}
            onRowClick={(id) => {
              setDetailId(id);
              setOpenDetail(true);
            }}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
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

      <AddSupplierModal open={open} onOpenChange={setOpen} />

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
