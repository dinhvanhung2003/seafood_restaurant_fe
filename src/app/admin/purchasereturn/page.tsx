"use client";

import { useState } from "react";
import PurchaseReturnTable from "@/components/admin/transaction/purchasereturn/table/ListPurchaseReturn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useSuppliers } from "@/hooks/admin/useSupplier";            // <-- THÊM
import CreatePurchaseReturnModal from "@/components/admin/transaction/purchasereturn/modal/CreatePurchaseReturnModal";
export default function PurchaseReturnsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // ====== FILTERS ======
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
  const [supplierQ, setSupplierQ] = useState("");                     // <-- THÊM: text tìm NCC
  type StatusOpt = "ALL" | "DRAFT" | "POSTED" | "REFUNDED" | "CANCELLED";
  const [status, setStatus] = useState<StatusOpt>("ALL");
 const [openCreate, setOpenCreate] = useState(false);
  // gọi hook NCC có sẵn (không tạo hook mới)
  const { data: supplierList, isFetching: loadingSuppliers } = useSuppliers(
    1,                       // page NCC (cố định 1 là đủ cho dropdown)
    10,                      // limit NCC
    { q: supplierQ }         // lọc theo tên/mã
  );

  return (
    <div className="p-4 space-y-3">
       <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Phiếu trả hàng nhập</div>
        <Button onClick={() => setOpenCreate(true)}>+ Tạo phiếu</Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        
        {/* -------- Nhà cung cấp -------- */}
        <div className="space-y-1">
          <Label>Tìm & chọn nhà cung cấp</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nhập tên/mã NCC để tìm…"
              value={supplierQ}
              onChange={(e) => setSupplierQ(e.target.value)}
              className="w-[220px]"
            />
            <Select
              value={supplierId ?? "ALL"}                       // luôn khác chuỗi rỗng
              onValueChange={(v) => {
                setSupplierId(v === "ALL" ? undefined : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder={loadingSuppliers ? "Đang tải…" : "Chọn nhà cung cấp"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">-- Tất cả --</SelectItem>
                {(supplierList?.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setPage(1)}>
              <Search className="h-4 w-4 mr-1" /> Lọc
            </Button>
          </div>
        </div>

        {/* -------- Trạng thái -------- */}
        <div className="space-y-1">
          <Label>Trạng thái</Label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as StatusOpt);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="-- Tất cả --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">-- Tất cả --</SelectItem>
              <SelectItem value="DRAFT">Nháp</SelectItem>
              <SelectItem value="POSTED">Đã ghi nhận</SelectItem>
              <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <PurchaseReturnTable
        page={page}
        limit={limit}
        onPageChange={setPage}
        supplierId={supplierId}
        status={status === "ALL" ? "" : status}
      />
      <CreatePurchaseReturnModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={() => {
          // có thể setPage(1) để refresh về trang 1
        }}
      />
    </div>
  );
}
