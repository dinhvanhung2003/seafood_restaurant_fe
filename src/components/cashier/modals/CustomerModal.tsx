"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, CalendarIcon } from "lucide-react";
import { useMemo, useState, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

type CustomerTypeVN = "Cá nhân" | "Công ty";
type GenderVN = "Nam" | "Nữ" | "Khác";

export type CreateCustomerPayload = {
  type: "PERSON" | "COMPANY";
  name: string;
  phone?: string;
  email?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  code?: string;
  birthDate?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  taxId?: string;
  citizenId?: string;
  branch?: string;
  group?: string;
  note?: string;
  avatarFile?: File | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: (payload: CreateCustomerPayload) => void;
};

export function CustomerModal({ open, onClose, onSaved }: Props) {
  const [typeVN, setTypeVN] = useState<CustomerTypeVN>("Cá nhân");
  const [genderVN, setGenderVN] = useState<GenderVN>("Nam");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [branch, setBranch] = useState("Chi nhánh trung tâm");
  const [taxId, setTaxId] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState("");
  const [note, setNote] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const typeBE: CreateCustomerPayload["type"] =
    typeVN === "Công ty" ? "COMPANY" : "PERSON";
  const genderBE: CreateCustomerPayload["gender"] = useMemo(() => {
    if (genderVN === "Nam") return "MALE";
    if (genderVN === "Nữ") return "FEMALE";
    return "OTHER";
  }, [genderVN]);

  const disabledSave = name.trim().length === 0;

  const handlePickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file || null);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(String(reader.result));
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSave = () => {
    if (!onSaved) return onClose();
    const payload: CreateCustomerPayload = {
      type: typeBE,
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      gender: genderBE,
      code: code.trim() || undefined,
      birthDate: birthDate || undefined,
      address: address.trim() || undefined,
      province: province.trim() || undefined,
      district: district.trim() || undefined,
      ward: ward.trim() || undefined,
      taxId: taxId.trim() || undefined,
      citizenId: citizenId.trim() || undefined,
      branch: branch.trim() || undefined,
      group: group.trim() || undefined,
      note: note.trim() || undefined,
      avatarFile,
    };
    onSaved(payload);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[90vw] md:max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px] 2xl:max-w-[1200px] rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Thêm khách hàng</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          {/* Cột ảnh + loại khách */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm">Loại khách</Label>
              <RadioGroup
                value={typeVN}
                onValueChange={(v) => setTypeVN(v as CustomerTypeVN)}
                className="flex gap-6 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Cá nhân" id="ca-nhan" />
                  <Label htmlFor="ca-nhan">Cá nhân</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Công ty" id="cong-ty" />
                  <Label htmlFor="cong-ty">Công ty</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className={cn("w-28 h-28 rounded-md border border-dashed grid place-items-center overflow-hidden bg-slate-50")}>
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <label className="text-sm font-medium text-blue-600 cursor-pointer">
                Chọn ảnh
                <input type="file" accept="image/*" className="hidden" onChange={handlePickAvatar} />
              </label>
            </div>
          </div>

          {/* Cột trái */}
          <div className="space-y-3">
            <Input placeholder="Mã khách hàng (tuỳ chọn)" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input placeholder="Tên khách hàng/Công ty *" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="VD: 0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="relative">
              <Input type="date" placeholder="Ngày/Tháng/Năm" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              <CalendarIcon className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Input placeholder="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input placeholder="Tỉnh / Thành phố" value={province} onChange={(e) => setProvince(e.target.value)} />
            <Input placeholder="Quận / Huyện" value={district} onChange={(e) => setDistrict(e.target.value)} />
            <Input placeholder="Phường / Xã" value={ward} onChange={(e) => setWard(e.target.value)} />
          </div>

          {/* Cột phải */}
          <div className="space-y-3">
            <Input placeholder="Chi nhánh" value={branch} onChange={(e) => setBranch(e.target.value)} />
            <Input placeholder="Mã số thuế" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            <Input placeholder="Căn cước công dân" value={citizenId} onChange={(e) => setCitizenId(e.target.value)} />
            <div className="space-y-1">
              <Label className="text-sm">Giới tính</Label>
              <RadioGroup value={genderVN} onValueChange={(v) => setGenderVN(v as GenderVN)} className="flex gap-6 mt-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Nam" id="nam" />
                  <Label htmlFor="nam">Nam</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Nữ" id="nu" />
                  <Label htmlFor="nu">Nữ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Khác" id="khac" />
                  <Label htmlFor="khac">Khác</Label>
                </div>
              </RadioGroup>
            </div>
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Nhóm" value={group} onChange={(e) => setGroup(e.target.value)} />
            <Textarea placeholder="Ghi chú" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary" className="rounded-lg">Bỏ qua</Button>
          </DialogClose>
          <Button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white" disabled={disabledSave} onClick={handleSave}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
