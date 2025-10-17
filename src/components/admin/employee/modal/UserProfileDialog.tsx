"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserProfileQuery, useUpdateUserProfileMutation, type UpdateProfilePayload } from "@/hooks/admin/useProfile";

export default function UserProfileDialog({
  userId, open, onOpenChange,
}: { userId?: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const profileQ = useUserProfileQuery(userId);
  const update = useUpdateUserProfileMutation();

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [addressList, setAddressList] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profileQ.data) return;
    const p = profileQ.data;
    setFullName(p.fullName ?? "");
    setDob(p.dob ?? "");
    setDescription(p.description ?? "");
    setAddress(p.address ?? "");
    setCity(p.city ?? "");
    setCountry(p.country ?? "");
    setAddressList((p.addressList ?? []).join(", "));
  }, [profileQ.data, open]);

  const onSave = () => {
    if (!userId) return;
    const file = fileRef.current?.files?.[0];
    const list = addressList.split(",").map(s => s.trim()).filter(Boolean);
    const payload: UpdateProfilePayload = {
      fullName, dob: dob || undefined, description, address, city, country,
      addressList: list.length ? list : undefined, avatar: file,
    };
    update.mutate({ userId, data: payload }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Hồ sơ người dùng</DialogTitle></DialogHeader>

        {!userId ? null : profileQ.isLoading ? (
          <div className="py-6 text-center">Đang tải…</div>
        ) : profileQ.error ? (
          <div className="py-6 text-center text-red-500">{(profileQ.error as Error).message}</div>
        ) : profileQ.data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-3">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border">
                {profileQ.data.avatar ? (
                  <img src={profileQ.data.avatar} alt="avatar" className="w-24 h-24 object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-slate-500">No avatar</div>
                )}
              </div>
              <div>
                <Label>Đổi ảnh đại diện</Label>
                <Input type="file" ref={fileRef} accept="image/*" />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Họ tên</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div>
                <Label>Email</Label>
                <Input readOnly value={profileQ.data.user.email} />
              </div>

              <div>
                <Label>Ngày sinh</Label>
                <Input type="date" value={dob || ""} onChange={(e) => setDob(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>Mô tả</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>Địa chỉ</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div>
                <Label>Thành phố</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>

              <div>
                <Label>Quốc gia</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>Danh sách địa chỉ (phân tách dấu phẩy)</Label>
                <Input value={addressList} onChange={(e) => setAddressList(e.target.value)} placeholder="Hà Nội, Đà Nẵng" />
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={onSave} disabled={update.isPending || profileQ.isLoading}>
            {update.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
