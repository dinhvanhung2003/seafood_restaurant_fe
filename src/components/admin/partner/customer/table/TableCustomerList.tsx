"use client";

import * as React from "react";
import { useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type VisibilityState,
  type Table as RTable,
} from "@tanstack/react-table";
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { customerColumns } from "./Column";
import type { CustomerRow } from "@/lib/admin/partner/customer/api";
import ColumnToggleKiot from "./ColumnToggle";
import ExcelDataIO from "@/utils/ExcelDataIO";
import { toast } from "sonner";
const STORAGE_KEY = "customer_table_visible_cols_v1";

/** Nút bật/tắt cột (embedded) */
function ColumnToggle<T>({ table }: { table: RTable<T> }) {
  const hideable = table.getAllLeafColumns().filter((c) => c.getCanHide());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Cột
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid grid-cols-2 gap-x-2 p-2">
          {hideable.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(v) => column.toggleVisibility(!!v)}
            >
              {String(column.columnDef.header ?? column.id)}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type Props = {
  data: CustomerRow[];
  onRowClick?: (row: CustomerRow) => void;
};

export default function CustomerTable({ data, onRowClick }: Props) {
  // dùng VisibilityState của tanstack v8
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const [customers, setCustomers] = React.useState<any[]>([]);

  const handleImport = (rows: any[]) => {
    console.log("Imported Excel rows:", rows);
    setCustomers(rows);
    toast.success(`Đã import ${rows.length} khách hàng từ Excel`);
  };

  // Load cấu hình ẩn/hiện cột đã lưu
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setColumnVisibility(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  // Lưu lại mỗi khi thay đổi
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const table = useReactTable({
    data,
    columns: customerColumns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-3">
      {/* Hàng action */}
      <div className="flex items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          <ExcelDataIO
            data={customers}
            fileName="customers.xlsx"
            columns={["code", "name", "phone", "address"]}
            onImport={handleImport}
          />
        </div>
        <ColumnToggleKiot table={table} />
      </div>

      {/* Bảng */}
      <div className="rounded-md border z-10">
        <UiTable>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="bg-sky-50">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                // row.original is your data object (CustomerRow)
                const original = row.original as CustomerRow;
                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => onRowClick?.(original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-24 text-center"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UiTable>
      </div>
    </div>
  );
}
