// components/suppliers/SidebarSupplierFilter.tsx
"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { SuppliersFilter } from "@/types/types";

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

      {/* <div>
        <Label>Nhóm NCC (ID)</Label>
        <Input
          placeholder="supplierGroupId"
          value={filters.supplierGroupId ?? ""}
          onChange={(e) => set("supplierGroupId", e.target.value)}
        />
      </div> */}

      <div>
        <Label>Thành phố</Label>
        <Input
          placeholder="VD: Hồ Chí Minh"
          value={filters.city ?? ""}
          onChange={(e) => set("city", e.target.value)}
        />
      </div>

      {/* <div className="flex items-center justify-between">
        <div>
          <Label>Include SupplierGroup</Label>
          <div className="text-xs text-muted-foreground">withGroup=true</div>
        </div>
        <Switch
          checked={!!filters.withGroup}
          onCheckedChange={(v) => set("withGroup", v)}
        />
      </div> */}
    </div>
  );
}
