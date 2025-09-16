// components/suppliers/SuppliersTable.tsx
"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Supplier } from "@/types/types";

type Props = {
  data: Supplier[];
  onRowClick?: (id: string) => void;
};

const dash = (v?: string | null) => (v && String(v).trim().length ? v : "-");

export default function SuppliersTable({ data, onRowClick }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Mã</TableHead>
            <TableHead className="min-w-[220px]">Tên NCC</TableHead>
            <TableHead className="w-[130px]">Điện thoại</TableHead>
            <TableHead className="w-[220px]">Email</TableHead>
            <TableHead className="w-[150px]">Thành phố</TableHead>
            <TableHead className="min-w-[260px]">Địa chỉ</TableHead>
            <TableHead className="w-[200px]">Nhóm</TableHead>
            <TableHead className="text-right w-[140px]">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((s) => (
            <TableRow
              key={s.id}
              className="cursor-pointer hover:bg-muted/40"
              onClick={() => onRowClick?.(s.id)}
            >
              <TableCell className="font-medium">{dash(s.code)}</TableCell>
              <TableCell>{dash(s.name)}</TableCell>
              <TableCell>{dash(s.phone)}</TableCell>
              <TableCell className="truncate">{dash(s.email)}</TableCell>
              <TableCell>{dash(s.city)}</TableCell>
              <TableCell className="max-w-[320px] truncate">{dash(s.address)}</TableCell>

              {/*  KHÔNG render object; chỉ hiển thị tên nhóm */}
              <TableCell>{s.supplierGroup?.name ?? "-"}</TableCell>

              <TableCell className="text-right">
                <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>
                  {s.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
