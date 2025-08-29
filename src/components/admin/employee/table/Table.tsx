"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Employee } from "@/types/employee";

export function EmployeeTable({ rows }: { rows: Employee[] }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-10"></TableHead>
            <TableHead>Mã NV</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Điện thoại</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Địa chỉ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(e => (
            <TableRow key={e.id}>
              <TableCell><Checkbox /></TableCell>
              <TableCell>{e.code}</TableCell>
              <TableCell>{e.profile.fullName}</TableCell>
              <TableCell>{e.username}</TableCell>
              <TableCell>{e.phoneNumber}</TableCell>
              <TableCell>{e.role}</TableCell>
              <TableCell>{e.profile.address || ""}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
