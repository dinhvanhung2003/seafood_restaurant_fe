"use client";

import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { User as UserIcon } from "lucide-react";

type Row = {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: string;
};

export default function StaffTable({
  rows, isLoading, onOpenProfile,onOpenSalary, onOpenFace
}: {
  rows: Row[];
  isLoading: boolean;
  onOpenProfile: (userId: string) => void;
  onOpenSalary: (userId: string) => void;
    onOpenFace: (userId: string, fullName: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          <TableHead>Họ tên</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>SĐT</TableHead>
          <TableHead>Vai trò</TableHead>
          <TableHead>Hồ sơ </TableHead>
         
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow><TableCell colSpan={6} className="py-10 text-center">Đang tải...</TableCell></TableRow>
        ) : rows.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Chưa có nhân viên</TableCell></TableRow>
        ) : (
          rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.fullName}</TableCell>
              <TableCell>{r.email}</TableCell>
              <TableCell>{r.username}</TableCell>
              <TableCell>{r.phoneNumber}</TableCell>
              <TableCell>{r.role}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => onOpenProfile(r.id)}>
                  <UserIcon className="h-4 w-4 mr-1" /> Xem/Sửa
                </Button>
                 <Button
    size="sm"
    onClick={() => onOpenSalary(r.id)}
  >
    Thiết lập lương
  </Button>
    <Button
                    size="sm"
                    onClick={() => onOpenFace(r.id, r.fullName)}
                  >
                    Khuôn mặt
                  </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
