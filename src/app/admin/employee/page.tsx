// app/(admin)/staff/page.tsx  (ví dụ đường dẫn)
"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useEmployee } from "@/hooks/admin/useEmployee";
import type { CreateUserPayload, Role } from "@/types/types";
import { ROLES } from "@/types/types";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

// helper: YYYY-MM-DD -> ISO 8601
function toISODate(d: string | undefined) {
  if (!d) return undefined;
  return new Date(`${d}T00:00:00`).toISOString();
}

type FormValues = {
  email: string;
  phoneNumber?: string;
  username?: string;
  password: string;
  role: Role;
  profile: {
    fullName: string;
    dob: string; // UI date string
    address: string;
  };
};

export default function StaffPage() {
  // 🔹 chỉ 1 hook
  const { rows, isLoading, createUser, createStatus } = useEmployee();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(k) ||
        r.email.toLowerCase().includes(k) ||
        r.username.toLowerCase().includes(k) ||
        r.phoneNumber.toLowerCase().includes(k)
    );
  }, [rows, q]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      phoneNumber: "",
      username: "",
      password: "",
      role: "WAITER",
      profile: { fullName: "", dob: "", address: "" },
    },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit((values) => {
    const payload: CreateUserPayload = {
      email: values.email,
      password: values.password,
      role: values.role,
      phoneNumber: values.phoneNumber || "",
      username: values.username || "",
      profile: {
        fullName: values.profile.fullName,
        dob: toISODate(values.profile.dob)!,
        address: values.profile.address,
      },
    };

    // gọi mutation từ hook gộp
    createUser(payload).then(() => {
      if (!createStatus.error) {
        setOpen(false);
        reset();
      }
    });
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh sách nhân viên</h1>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Nhân viên
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm nhân viên</DialogTitle>
            </DialogHeader>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2" onSubmit={onSubmit}>
              <div>
                <Label>Họ và tên *</Label>
                <Input
                  placeholder="Nguyễn Văn B"
                  {...register("profile.fullName", {
                    required: "Vui lòng nhập họ tên",
                    minLength: { value: 2, message: "Họ tên quá ngắn" },
                  })}
                />
                {errors.profile?.fullName && (
                  <p className="text-sm text-red-500 mt-1">{errors.profile.fullName.message}</p>
                )}
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="staff03@restaurant.com"
                  {...register("email", {
                    required: "Vui lòng nhập email",
                    pattern: {
                      value:
                        /^(?:[a-zA-Z0-9_'^&\-]+(?:\.[a-zA-Z0-9_'^&\-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
                      message: "Email không hợp lệ",
                    },
                  })}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Label>Số điện thoại *</Label>
                <Input
                  placeholder="0801234587"
                  {...register("phoneNumber", { required: "Vui lòng nhập số điện thoại" })}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <Label>Username *</Label>
                <Input
                  placeholder="staff3"
                  {...register("username", { required: "Vui lòng nhập username" })}
                />
                {errors.username && (
                  <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <Label>Mật khẩu *</Label>
                <Input
                  type="password"
                  placeholder="123456789"
                  {...register("password", { required: "Vui lòng nhập mật khẩu", minLength: { value: 6, message: "Ít nhất 6 ký tự" } })}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label>Vai trò *</Label>
                <Controller
                  control={control}
                  name="role"
                  rules={{ required: "Vui lòng chọn vai trò" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as Role)}>
                      <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-sm text-red-500 mt-1">{errors.role.message as string}</p>
                )}
              </div>

              <div>
                <Label>Ngày sinh *</Label>
                <Input
                  type="date"
                  placeholder="2000-01-01"
                  {...register("profile.dob", { required: "Vui lòng chọn ngày sinh" })}
                />
                {errors.profile?.dob && (
                  <p className="text-sm text-red-500 mt-1">{errors.profile.dob.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Địa chỉ *</Label>
                <Input
                  placeholder="123 Lê Lợi, Q.2"
                  {...register("profile.address", { required: "Vui lòng nhập địa chỉ" })}
                />
                {errors.profile?.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.profile.address.message}</p>
                )}
              </div>

              <DialogFooter className="mt-4 md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createStatus.isPending}>
                  {createStatus.isPending ? "Đang lưu..." : "Lưu nhân viên"}
                </Button>
              </DialogFooter>
            </form>
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
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Chưa có nhân viên
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
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
