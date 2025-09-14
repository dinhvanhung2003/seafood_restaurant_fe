// components/customers/sidebar-filter.tsx
"use client";
import type { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type CustomersFilter = {
  q?: string;
  type?: "" | "PERSONAL" | "COMPANY";
  gender?: "" | "MALE" | "FEMALE" | "OTHER";
  createdFrom?: string;
  createdTo?: string;
  birthdayFrom?: string;
  birthdayTo?: string;
  province?: string;
  district?: string;
  ward?: string;
};

export default function SidebarFilter({
  filters,
  onChange,
}: {
  filters: CustomersFilter;
  onChange: Dispatch<SetStateAction<CustomersFilter>>;
}) {
  const set = (k: keyof CustomersFilter, v: any) =>
    onChange((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6 p-4 w-64">
      <div>
        <Label>Tìm kiếm</Label>
        <Input
          placeholder="Mã, tên, điện thoại, email"
          value={filters.q ?? ""}
          onChange={(e) => set("q", e.target.value)}
        />
      </div>

      <div>
        <Label>Loại khách</Label>
        <RadioGroup
          value={filters.type ?? ""}
          onValueChange={(v) => set("type", v as any)}
          className="mt-2 space-y-2"
        >
          <label className="flex items-center gap-2">
            <RadioGroupItem value="" /> Tất cả
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="PERSONAL" /> Cá nhân
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="COMPANY" /> Công ty
          </label>
        </RadioGroup>
      </div>

      <div>
        <Label>Giới tính</Label>
        <RadioGroup
          value={filters.gender ?? ""}
          onValueChange={(v) => set("gender", v as any)}
          className="mt-2 space-y-2"
        >
          <label className="flex items-center gap-2">
            <RadioGroupItem value="" /> Không chọn
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="MALE" /> Nam
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="FEMALE" /> Nữ
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="OTHER" /> Khác
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Ngày tạo</Label>
        <Input
          type="date"
          value={filters.createdFrom ?? ""}
          onChange={(e) => set("createdFrom", e.target.value)}
        />
        <Input
          type="date"
          value={filters.createdTo ?? ""}
          onChange={(e) => set("createdTo", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Ngày sinh</Label>
        <Input
          type="date"
          value={filters.birthdayFrom ?? ""}
          onChange={(e) => set("birthdayFrom", e.target.value)}
        />
        <Input
          type="date"
          value={filters.birthdayTo ?? ""}
          onChange={(e) => set("birthdayTo", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tỉnh / Thành phố</Label>
        <Input
          value={filters.province ?? ""}
          onChange={(e) => set("province", e.target.value)}
        />
        <Label>Quận / Huyện</Label>
        <Input
          value={filters.district ?? ""}
          onChange={(e) => set("district", e.target.value)}
        />
        <Label>Phường / Xã</Label>
        <Input
          value={filters.ward ?? ""}
          onChange={(e) => set("ward", e.target.value)}
        />
      </div>
    </div>
  );
}
