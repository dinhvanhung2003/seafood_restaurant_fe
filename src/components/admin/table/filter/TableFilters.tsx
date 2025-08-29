"use client";


import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";


type Status = "active" | "inactive";


type Area = {
  id: string;
  name: string;
};


type Props = {
  areaFilter: string;
  setAreaFilter: Dispatch<SetStateAction<string>>;
  statusFilter: Status | "all";
  setStatusFilter: Dispatch<SetStateAction<Status | "all">>;
  q: string;
  setQ: Dispatch<SetStateAction<string>>;
  areas: Area[];
  total: number;
  setShowAddArea: Dispatch<SetStateAction<boolean>>;
};


export default function TableFilters({
  areaFilter,
  setAreaFilter,
  statusFilter,
  setStatusFilter,
  q,
  setQ,
  areas,
  total,
  setShowAddArea,
}: Props) {
  return (
    <div className="flex flex-col space-y-4">
      {/* Khu vực */}
      <div className="rounded-lg border p-4 bg-white shadow-sm">
        <Label className="mb-1 block flex items-center justify-between">
          Khu vực
          <button
            type="button"
            onClick={() => setShowAddArea(true)}
            className="text-sm text-blue-600 hover:underline ml-2"
          >
            <Plus size={14} />
          </button>
        </Label>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger>
            <SelectValue placeholder="--Tất cả--" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">-- Tất cả --</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {/* Tìm kiếm */}
      <div className="rounded-lg border p-4 bg-white shadow-sm">
        <Label className="mb-1 block">Tìm kiếm</Label>
        <Input
          placeholder="Theo tên phòng/bàn"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>


      {/* Trạng thái */}
      <div className="rounded-lg border p-4 bg-white shadow-sm">
        <Label className="mb-2 block">Trạng thái</Label>
        <RadioGroup
          className="flex flex-col gap-2"
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as Status | "all")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="st1" value="active" />
            <Label htmlFor="st1">Hoạt động</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="st2" value="inactive" />
            <Label htmlFor="st2">Ngừng hoạt động</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="st3" value="all" />
            <Label htmlFor="st3">Tất cả</Label>
          </div>
        </RadioGroup>
      </div>


      {/* Tổng số bản ghi */}
      <div className="rounded-lg border p-4 bg-white shadow-sm">
        <Label className="mb-1 block">Số bản ghi</Label>
        <div className="text-sm text-slate-600">{total}</div>
      </div>
    </div>
  );
}