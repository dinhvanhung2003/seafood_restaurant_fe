"use client";

import { useMemo, useState } from "react";
import { useEmployeesQuery, useCreateUserMutation, toRow } from "@/components/admin/employee/queries";
import type { CreateUserPayload, Role } from "@/types/employee";
import { ROLES } from "@/types/employee";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

// helper: YYYY-MM-DD -> ISO 8601
function toISODate(d: string | undefined) {
  if (!d) return undefined;
  // thêm T00:00:00 để tránh lệch timezone
  const iso = new Date(`${d}T00:00:00`).toISOString();
  return iso;
}

export default function StaffPage() {
  const { data, isLoading } = useEmployeesQuery();
  const { mutate, isPending } = useCreateUserMutation();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const [draft, setDraft] = useState<CreateUserPayload>({
    email: "",
    phoneNumber: "",
    username: "",
    password: "",
    role: "WAITER",
    profile: { fullName: "", dob: "", address: "" },
  });

  const rows = useMemo(() => {
    const list = (data ?? []).map(toRow);
    const k = q.trim().toLowerCase();
    if (!k) return list;
    return list.filter(
      (r) =>
        r.fullName.toLowerCase().includes(k) ||
        r.email.toLowerCase().includes(k) ||
        r.username.toLowerCase().includes(k) ||
        r.phoneNumber.toLowerCase().includes(k)
    );
  }, [data, q]);

  const onSubmit = () => {
    // các trường bắt buộc theo yêu cầu
    if (
      !draft.email ||
      !draft.password ||
      !draft.role ||
      !draft.profile.fullName ||
      !draft.profile.dob ||
      !draft.profile.address
    ) {
      return;
    }

    // chuẩn hoá ngày sinh sang ISO
    const payload: CreateUserPayload = {
      ...draft,
      phoneNumber: draft.phoneNumber || "", // BE của bạn đang nhận có string
      username: draft.username || "",
      profile: {
        ...draft.profile,
        dob: toISODate(draft.profile.dob)!,   // ISO 8601
        address: draft.profile.address!,
      },
    };

    mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        setDraft({
          email: "",
          phoneNumber: "",
          username: "",
          password: "",
          role: "WAITER",
          profile: { fullName: "", dob: "", address: "" },
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh sách nhân viên</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Nhân viên
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Thêm nhân viên</DialogTitle></DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label>Họ và tên *</Label>
                <Input
                  value={draft.profile.fullName}
                  onChange={(e) => setDraft({ ...draft, profile: { ...draft.profile, fullName: e.target.value } })}
                  placeholder="Nguyễn Văn B"
                />
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="staff03@restaurant.com"
                />
              </div>

              <div>
                <Label>Số điện thoại *</Label>
                <Input
                  value={draft.phoneNumber ?? ""}
                  onChange={(e) => setDraft({ ...draft, phoneNumber: e.target.value })}
                  placeholder="0801234587"
                />
              </div>

              <div>
                <Label>Username *</Label>
                <Input
                  value={draft.username ?? ""}
                  onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                  placeholder="staff3"
                />
              </div>

              <div>
                <Label>Mật khẩu *</Label>
                <Input
                  type="password"
                  value={draft.password}
                  onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                  placeholder="123456789"
                />
              </div>

              <div>
                <Label>Vai trò *</Label>
                <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v as Role })}>
                  <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ngày sinh *</Label>
                <Input
                  type="date"
                  value={draft.profile.dob ?? ""}
                  onChange={(e) => setDraft({ ...draft, profile: { ...draft.profile, dob: e.target.value } })}
                  placeholder="2000-01-01"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Địa chỉ *</Label>
                <Input
                  value={draft.profile.address ?? ""}
                  onChange={(e) => setDraft({ ...draft, profile: { ...draft.profile, address: e.target.value } })}
                  placeholder="123 Lê Lợi, Q.2"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={onSubmit} disabled={isPending}>
                {isPending ? "Đang lưu..." : "Lưu nhân viên"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="max-w-lg">
        <Input
          placeholder="Tìm theo tên, email, username, SĐT"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Vai trò</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center">Đang tải...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Chưa có nhân viên</TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.fullName}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.username}</TableCell>
                  <TableCell>{r.phoneNumber}</TableCell>
                  <TableCell>{r.role}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
