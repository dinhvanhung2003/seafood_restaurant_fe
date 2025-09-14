"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { SlidersHorizontal } from "lucide-react";
import type { Table } from "@tanstack/react-table";

type Props<T> = { table: Table<T> };

export default function ColumnToggleKiot<T>({ table }: Props<T>) {
  // lấy các cột có thể ẩn/hiện
  const cols = table.getAllLeafColumns().filter((c) => c.getCanHide());

  // chia 2 cột để render giống ảnh
  const mid = Math.ceil(cols.length / 2);
  const left = cols.slice(0, mid);
  const right = cols.slice(mid);

  // class checkbox xanh lá
  const checkboxClass =
    "h-4 w-4 rounded border-emerald-600 data-[state=checked]:bg-emerald-600 " +
    "data-[state=checked]:text-white focus-visible:ring-0 focus-visible:ring-offset-0";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 z-50">
          <SlidersHorizontal className="h-4 w-4" />
          Hiển thị
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
         className="w-[380px] p-2 shadow-xl rounded-lg z-[9999]"
        sideOffset={8}
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 z-10">
          {/* cột trái */}
          <div className="space-y-1">
            {left.map((col) => (
              <label key={col.id} className="flex items-center gap-2 py-1">
                <Checkbox
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  className={checkboxClass}
                />
                <span className="text-[14px]">
                  {String(col.columnDef.header ?? col.id)}
                </span>
              </label>
            ))}
          </div>

          {/* cột phải */}
          <div className="space-y-1">
            {right.map((col) => (
              <label key={col.id} className="flex items-center gap-2 py-1">
                <Checkbox
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  className={checkboxClass}
                />
                <span className="text-[14px]">
                  {String(col.columnDef.header ?? col.id)}
                </span>
              </label>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
