// components/suppliers/SidebarSupplierFilter.tsx
"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SuppliersFilter } from "@/types/types";
import SupplierGroupPicker from "@/components/admin/partner/supplier/supplier-group/SupplierGroupPicker";

export default function SidebarSupplierFilter({
  filters,
  onChange,
}: {
  filters: SuppliersFilter;
  onChange: Dispatch<SetStateAction<SuppliersFilter>>;
}) {
  const set = (k: keyof SuppliersFilter, v: any) =>
    onChange((s) => ({ ...s, [k]: v }));

  return (
    <div className="w-72 p-4 space-y-6">
      <div>
        <Label>Tìm kiếm</Label>
        <Input
          placeholder="Mã, tên, phone, email, địa chỉ…"
          value={filters.q ?? ""}
          onChange={(e) => set("q", e.target.value)}
        />
      </div>

      <div>
        <Label>Trạng thái</Label>
        <RadioGroup
          value={filters.status ?? ""}
          onValueChange={(v) => set("status", v as any)}
          className="mt-2 space-y-2"
        >
          <label className="flex items-center gap-2">
            <RadioGroupItem value="" /> Tất cả
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="ACTIVE" /> Đang hoạt động
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="INACTIVE" /> Ngừng hoạt động
          </label>
        </RadioGroup>
      </div>

      {/* === Nhóm NCC ngay trong filter === */}
      <SupplierGroupPicker
        value={filters.supplierGroupId ?? null}
        onChange={(id) => set("supplierGroupId", id)}
      />

      <div>
        <Label>Thành phố</Label>
        <Input
          placeholder="VD: Hồ Chí Minh"
          value={filters.city ?? ""}
          onChange={(e) => set("city", e.target.value)}
        />
      </div>
    </div>
  );
}
