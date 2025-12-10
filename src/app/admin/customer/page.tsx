"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import CustomerTable from "@/components/admin/partner/customer/table/TableCustomerList";
import AddCustomerModal from "@/components/admin/partner/customer/modal/AddCustomerModal";
import CustomerDetailModal from "@/components/admin/partner/customer/modal/CustomerModalDetail";
import { useCustomers } from "@/hooks/admin/useCustomer";
import SidebarFilter, { CustomersFilter } from "@/components/admin/partner/customer/filter/CustomerFilter";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  // selected / modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const onRowClick = (c: any) => {
    setSelectedCustomerId(c.id);
    setDetailOpen(true);
  };

  // state filter
  const [filters, setFilters] = useState<CustomersFilter>({
    q: "",
    type: "",
    gender: "",
  });

  const { data, isLoading } = useCustomers(page, limit, filters);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex">
      {/* Sidebar filter */}
      <div className="w-64 border-r">
        <SidebarFilter filters={filters} onChange={setFilters} />
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Khách hàng</h2>
          <Button onClick={() => setOpen(true)}>+ Khách hàng</Button>
        </div>

        {isLoading ? (
          <div>Đang tải...</div>
        ) : (
          <CustomerTable data={data?.data ?? []} onRowClick={onRowClick} />
        )}
        <CustomerDetailModal
          open={detailOpen}
          setOpen={setDetailOpen}
          customerId={selectedCustomerId}
        />

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

        <AddCustomerModal open={open} onOpenChange={setOpen} />
      </div>
    </div>
  );
}
