"use client";

import { Dispatch, SetStateAction } from "react";

export default function PromotionFilters({
  search,
  setSearch,
  status,
  setStatus,
  setPage,
}: {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  status: "all" | "true" | "false";
  setStatus: Dispatch<SetStateAction<"all" | "true" | "false">>;
  setPage: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="flex-1">
        <label className="text-sm font-medium">Tìm kiếm</label>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tên khuyến mãi, mã KM..."
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>
      <div className="w-full md:w-64">
        <label className="text-sm font-medium">Trạng thái</label>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setPage(1);
          }}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          <option value="all">Tất cả</option>
          <option value="true">Đang kích hoạt</option>
          <option value="false">Tạm tắt</option>
        </select>
      </div>
    </div>
  );
}
