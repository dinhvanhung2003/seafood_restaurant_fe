"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal } from "lucide-react";

type Customer = {
  id: string;
  code?: string;
  name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  address?: string;
  notes?: string;
  companyName?: string;
  taxNo?: string;
};

type Props = {
  data: Customer[];
  onRowClick?: (c: Customer) => void;
};

type ColKey =
  | "code"
  | "name"
  | "phone"
  | "email"
  | "gender"
  | "address"
  | "notes"
  | "companyName"
  | "taxNo";

const COL_LABEL: Record<ColKey, string> = {
  code: "Mã khách hàng",
  name: "Tên khách hàng",
  phone: "Điện thoại",
  email: "Email",
  gender: "Giới tính",
  address: "Địa chỉ",
  notes: "Ghi chú",
  companyName: "Công ty",
  taxNo: "Mã số thuế",
};

export default function CustomerTable({ data, onRowClick }: Props) {
  // default columns giống ảnh + thêm Email
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>({
    code: true,
    name: true,
    phone: true,
    email: true,        // ✅ thêm email
    gender: true,
    address: true,
    notes: true,
    companyName: true,
    taxNo: true,
  });

  // selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const ids = useMemo(() => data.map((d) => d.id), [data]);
  const allChecked = ids.length > 0 && ids.every((id) => selected[id]);
  const someChecked = ids.some((id) => selected[id]) && !allChecked;

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) ids.forEach((id) => (next[id] = true));
    setSelected(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((s) => ({ ...s, [id]: checked }));
  };

  const toggleCol = (k: ColKey) => {
    setVisibleCols((v) => ({ ...v, [k]: !v[k] }));
  };

  const renderCell = (c: Customer, key: ColKey) => {
    const v = (c as any)[key];
    return v && String(v).trim().length ? String(v) : "-";
  };

  return (
    <div className="space-y-2">
      {/* Toolbar: nút Hiển thị */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Hiển thị
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {(Object.keys(visibleCols) as ColKey[]).map((k) => (
              <DropdownMenuCheckboxItem
                key={k}
                checked={visibleCols[k]}
                onCheckedChange={() => toggleCol(k)}
              >
                {COL_LABEL[k]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={(v) => toggleAll(Boolean(v))}
                />
              </TableHead>

              {visibleCols.code && <TableHead>{COL_LABEL.code}</TableHead>}
              {visibleCols.name && <TableHead>{COL_LABEL.name}</TableHead>}
              {visibleCols.phone && <TableHead>{COL_LABEL.phone}</TableHead>}
              {visibleCols.email && <TableHead>{COL_LABEL.email}</TableHead>}
              {visibleCols.gender && <TableHead>{COL_LABEL.gender}</TableHead>}
              {visibleCols.address && <TableHead>{COL_LABEL.address}</TableHead>}
              {visibleCols.notes && <TableHead>{COL_LABEL.notes}</TableHead>}
              {visibleCols.companyName && <TableHead>{COL_LABEL.companyName}</TableHead>}
              {visibleCols.taxNo && <TableHead>{COL_LABEL.taxNo}</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => onRowClick?.(c)}
                >
                  <TableCell
                    className="w-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={Boolean(selected[c.id])}
                      onCheckedChange={(v) => toggleOne(c.id, Boolean(v))}
                    />
                  </TableCell>

                  {visibleCols.code && <TableCell>{renderCell(c, "code")}</TableCell>}
                  {visibleCols.name && <TableCell>{renderCell(c, "name")}</TableCell>}
                  {visibleCols.phone && <TableCell>{renderCell(c, "phone")}</TableCell>}
                  {visibleCols.email && <TableCell>{renderCell(c, "email")}</TableCell>}
                  {visibleCols.gender && <TableCell>{renderCell(c, "gender")}</TableCell>}
                  {visibleCols.address && (
                    <TableCell className="max-w-[520px] truncate">
                      {renderCell(c, "address")}
                    </TableCell>
                  )}
                  {visibleCols.notes && <TableCell>{renderCell(c, "notes")}</TableCell>}
                  {visibleCols.companyName && <TableCell>{renderCell(c, "companyName")}</TableCell>}
                  {visibleCols.taxNo && <TableCell>{renderCell(c, "taxNo")}</TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
