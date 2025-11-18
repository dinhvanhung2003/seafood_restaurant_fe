// app/(admin)/suppliers/page.tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import SuppliersTable from "@/components/admin/partner/supplier/table/SupplierTable";
import SidebarSupplierFilter from "@/components/admin/partner/supplier/filter/SideBarSupplierFilter";
import { useSuppliers } from "@/hooks/admin/useSupplier";
import type { SuppliersFilter } from "@/types/types";
import AddSupplierModal from "@/components/admin/partner/supplier/modal/AddSupplierModal";
import SupplierDetailModal from "@/components/admin/partner/supplier/modal/SupplierDetailModal";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
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

  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.pages ?? Math.max(1, Math.ceil(total / limit));

  // Tạo mảng số trang với ellipsis (…)
  const pageItems: (number | "ellipsis")[] = useMemo(() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items: (number | "ellipsis")[] = [];
    items.push(1);
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    if (left > 2) items.push("ellipsis");
    for (let p = left; p <= right; p++) items.push(p);
    if (right < totalPages - 1) items.push("ellipsis");
    items.push(totalPages);
    return items;
  }, [totalPages, page]);

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

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} • Tổng: {total}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className={page === 1 ? "pointer-events-none opacity-40" : ""}
                />
              </PaginationItem>
              {pageItems.map((it, idx) => (
                <PaginationItem key={idx}>
                  {it === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={page === it}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(it);
                      }}
                    >
                      {it}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  className={
                    page === totalPages ? "pointer-events-none opacity-40" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
