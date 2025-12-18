"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useUserProfileQuery,
  useUpdateUserProfileMutation,
  type UpdateProfilePayload,
} from "@/hooks/admin/useProfile";
import { useUpdateUserMutation } from "@/hooks/admin/useUser";

function normalizePhone(input: string) {
  return (input || "").replace(/\D/g, "");
}
function isValidPhone(phone: string) {
  return /^0\d{9}$/.test(phone); // 10 số bắt đầu 0
}

export default function UserProfileDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const profileQ = useUserProfileQuery(userId);

  const updateProfile = useUpdateUserProfileMutation();
  const updateUser = useUpdateUserMutation();

  // user fields
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const phoneRef = useRef<HTMLInputElement>(null);

  // profile fields (tối giản)
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!profileQ.data) return;
    const p = profileQ.data;

    setUsername(p.user?.username ?? "");
    setPhoneNumber(p.user?.phoneNumber ?? "");

    setFullName(p.fullName ?? "");
    setDob(p.dob ?? "");
    setDescription(p.description ?? "");
    setAddress(p.address ?? "");
  }, [profileQ.data, open]);

  const isSaving =
    updateProfile.isPending || updateUser.isPending || profileQ.isLoading;

  const onSave = async () => {
    if (!userId) return;

    const phone = normalizePhone(phoneNumber);

    // FE rule
    if (phone && !isValidPhone(phone)) {
      toast.error("SĐT phải gồm 10 chữ số và bắt đầu bằng 0");
      phoneRef.current?.focus();
      return;
    }

    const payloadUser = {
      username: username?.trim() || undefined,
      phoneNumber: phone || undefined,
    };

    const payloadProfile: UpdateProfilePayload = {
      fullName,
      dob: dob || undefined,
      description,
      address, // ✅ chỉ còn 1 dòng địa chỉ
      // ❌ bỏ city/country/addressList
    };

    try {
      // ✅ chạy tuần tự để tránh “thành công nửa vời”
      await updateUser.mutateAsync({ userId, data: payloadUser });
      await updateProfile.mutateAsync({ userId, data: payloadProfile });

      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Cập nhật thất bại";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hồ sơ người dùng</DialogTitle>
        </DialogHeader>

        {!userId ? null : profileQ.isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Đang tải…
          </div>
        ) : profileQ.error ? (
          <div className="py-8 text-center text-sm text-red-500">
            {(profileQ.error as Error).message}
          </div>
        ) : profileQ.data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Số điện thoại</Label>
              <Input
                ref={phoneRef}
                value={phoneNumber}
                placeholder="VD: 0901234567"
                onChange={(e) => setPhoneNumber(normalizePhone(e.target.value))}
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label>Email</Label>
              <Input readOnly value={profileQ.data.user.email} />
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label>Họ tên</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Ngày sinh</Label>
              <Input type="date" value={dob || ""} onChange={(e) => setDob(e.target.value)} />
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label>Địa chỉ</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="md:col-span-2 space-y-1">
              <Label>Mô tả</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
