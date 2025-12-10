"use client";

import { Controller, useForm } from "react-hook-form";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployee } from "@/hooks/admin/useEmployee";
import type { CreateUserPayload, Role } from "@/types/types";
import { ROLES } from "@/types/types";
import { Plus } from "lucide-react";
import React from "react";
function toISODate(d?: string) { return d ? new Date(`${d}T00:00:00`).toISOString() : undefined; }

type FormValues = {
  email: string;
  phoneNumber?: string;
  username?: string;
  password: string;
  role: Role;
  profile: { fullName: string; dob: string; address: string; };
};

export default function CreateEmployeeDialog() {
  const { createUser, createStatus } = useEmployee(1, 10, "");
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,              // 👈 THÊM DÒNG NÀY
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
const vnPhoneRegex =
  /^(0[3|5|7|8|9][0-9]{8}|(\+84|84)[3|5|7|8|9][0-9]{8})$/;

 const onSubmit = handleSubmit(async (values) => {
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

  try {
    await createUser(payload);
    reset();
    setOpen(false);
  } catch (e: any) {
    const msg = e?.response?.data?.message || "Thêm nhân viên thất bại";

    // nếu BE trả đúng message trùng SĐT thì map vào field
    if (msg.includes("Số điện thoại")) {
      setError("phoneNumber", {
        type: "server",
        message: msg,
      });
    } else if (msg.includes("Email")) {
      setError("email", { type: "server", message: msg });
    } else if (msg.includes("Username")) {
      setError("username", { type: "server", message: msg });
    }
  }
});
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Nhân viên
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Thêm nhân viên</DialogTitle></DialogHeader>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2" onSubmit={onSubmit}>
          <div>
            <Label>Họ và tên *</Label>
            <Input {...register("profile.fullName", { required: "Vui lòng nhập họ tên", minLength: { value: 2, message: "Họ tên quá ngắn" } })} />
            {errors.profile?.fullName && <p className="text-sm text-red-500 mt-1">{errors.profile.fullName.message}</p>}
          </div>

          <div>
            <Label>Email *</Label>
            <Input type="email" {...register("email", { required: "Vui lòng nhập email", pattern: { value: /.+@.+\..+/, message: "Email không hợp lệ" } })} />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>

       <div>
  <Label>Số điện thoại *</Label>
  <Input
    {...register("phoneNumber", {
      required: "Vui lòng nhập số điện thoại",
      pattern: {
        value: vnPhoneRegex,
        message: "Số điện thoại Việt Nam không hợp lệ (10 số)",
      },
    })}
  />
  {errors.phoneNumber && (
    <p className="text-sm text-red-500 mt-1">
      {errors.phoneNumber.message}
    </p>
  )}
</div>

          <div>
            <Label>Username *</Label>
            <Input {...register("username", { required: "Vui lòng nhập username" })} />
            {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <Label>Mật khẩu *</Label>
            <Input type="password" {...register("password", { required: "Vui lòng nhập mật khẩu", minLength: { value: 6, message: "Ít nhất 6 ký tự" } })} />
            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
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
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role.message as string}</p>}
          </div>

          <div>
            <Label>Ngày sinh *</Label>
            <Input type="date" {...register("profile.dob", { required: "Vui lòng chọn ngày sinh" })} />
            {errors.profile?.dob && <p className="text-sm text-red-500 mt-1">{errors.profile.dob.message}</p>}
          </div>

          <div className="md:col-span-2">
            <Label>Địa chỉ *</Label>
            <Input {...register("profile.address", { required: "Vui lòng nhập địa chỉ" })} />
            {errors.profile?.address && <p className="text-sm text-red-500 mt-1">{errors.profile.address.message}</p>}
          </div>

          <DialogFooter className="mt-4 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={createStatus.isPending}>
              {createStatus.isPending ? "Đang lưu..." : "Lưu nhân viên"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
