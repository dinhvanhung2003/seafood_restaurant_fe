"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useCreateCustomer } from "@/hooks/admin/useCustomer";

/** Enums trùng BE */
type CustomerType = "PERSONAL" | "COMPANY";
type Gender = "" | "MALE" | "FEMALE" | "OTHER";

type FormState = {
  type: CustomerType;
  code?: string;
  name: string;
  companyName?: string; // chỉ dùng khi COMPANY
  phone?: string;
  email?: string;
  gender: Gender;
  birthday?: string; // YYYY-MM-DD
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  taxNo?: string;
  identityNo?: string;
  note?: string;
};

export default function AddCustomerModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateCustomer();

  const [form, setForm] = React.useState<FormState>({
    type: "PERSONAL",
    name: "",
    gender: "",
  });

  const set = (k: keyof FormState, v: any) =>
    setForm((s) => ({ ...s, [k]: v }));

  const resetMinimal = () =>
    setForm({
      type: "PERSONAL",
      name: "",
      gender: "",
    });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.info("Tên khách hàng là bắt buộc");
      return;
    }

    // build payload: bỏ field rỗng để tránh 400
    const payload: any = {
      type: form.type,
      name: form.name.trim(),
      code: form.code || undefined,
      companyName:
        form.type === "COMPANY" ? form.companyName || undefined : undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      gender: form.gender || undefined,
      birthday: form.birthday || undefined,
      address: form.address || undefined,
      province: form.province || undefined,
      district: form.district || undefined,
      ward: form.ward || undefined,
      taxNo: form.taxNo || undefined,
      identityNo: form.identityNo || undefined,
      note: form.note || undefined,
    };

    try {
      await create.mutateAsync(payload);
      toast.success("Thêm khách hàng thành công");
      onOpenChange(false);
      resetMinimal();
    } catch {
      /* toast đã hiển thị trong hook onError (nếu bạn set) */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Thêm khách hàng</DialogTitle>
        </DialogHeader>

        {/* GRID CHA 3 CỘT: 132px (ảnh) + 2 cột form */}
        <div className="grid grid-cols-[132px_1fr_1fr] gap-x-5 gap-y-4 items-start">
          {/* Cột ảnh */}
          <div className="col-span-1">
            <div className="h-[120px] w-[120px] rounded border bg-muted" />
            <Button className="mt-2 w-[120px] bg-emerald-600 hover:bg-emerald-700">
              Chọn ảnh
            </Button>
          </div>

          {/* GRID CON 2 CỘT CHO TOÀN BỘ FIELD */}
          <div className="col-span-2 grid grid-cols-2 gap-x-5 gap-y-4 min-w-0">
            {/* Loại khách (chiếm 2 cột) */}
            <div className="col-span-2">
              <Label>Loại khách</Label>
              <RadioGroup
                value={form.type}
                onValueChange={(v) => set("type", v as CustomerType)}
                className="mt-2 flex gap-6"
              >
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="PERSONAL" /> Cá nhân
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="COMPANY" /> Công ty
                </label>
              </RadioGroup>
            </div>

            {/* Hàng 1 */}
            <Field label="Mã khách hàng">
              <Input
                placeholder="Mặc định"
                value={form.code || ""}
                onChange={(e) => set("code", e.target.value)}
              />
            </Field>
            <Field label={form.type === "COMPANY" ? "Công ty" : "Chi nhánh"}>
              <Input
                value={form.companyName || ""}
                onChange={(e) => set("companyName", e.target.value)}
                disabled={form.type !== "COMPANY"}
              />
            </Field>

            {/* Hàng 2 */}
            <Field label="Tên khách hàng/Công ty">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Mã số thuế">
              <Input
                value={form.taxNo || ""}
                onChange={(e) => set("taxNo", e.target.value)}
              />
            </Field>

            {/* Hàng 3 */}
            <Field label="Điện thoại">
              <Input
                value={form.phone || ""}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="Căn cước công dân">
              <Input
                value={form.identityNo || ""}
                onChange={(e) => set("identityNo", e.target.value)}
              />
            </Field>

            {/* Hàng 4 */}
            <Field label="Ngày sinh">
              <Input
                type="date"
                value={form.birthday || ""}
                onChange={(e) => set("birthday", e.target.value)}
              />
            </Field>
            <div className="space-y-1">
              <Label>Giới tính</Label>
              <RadioGroup
                value={form.gender}
                onValueChange={(v) => set("gender", v as Gender)}
                className="mt-2 grid grid-cols-3 gap-3"
              >
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="" /> Không chọn
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="MALE" /> Nam
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="FEMALE" /> Nữ
                </label>
                <label className="flex items-center gap-2">
                  <RadioGroupItem value="OTHER" /> Khác
                </label>
              </RadioGroup>
            </div>

            {/* Hàng 5 */}
            <Field label="Email">
              <Input
                type="email"
                value={form.email || ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Địa chỉ">
              <Input
                value={form.address || ""}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>

            {/* Hàng 6 */}
            <Field label="Tỉnh / Thành phố">
              <Input
                value={form.province || ""}
                onChange={(e) => set("province", e.target.value)}
                placeholder="Tỉnh / Thành phố"
              />
            </Field>
            <Field label="Quận / Huyện">
              <Input
                value={form.district || ""}
                onChange={(e) => set("district", e.target.value)}
                placeholder="Quận / Huyện"
              />
            </Field>

            {/* Hàng 7 */}
            <Field label="Phường / Xã">
              <Input
                value={form.ward || ""}
                onChange={(e) => set("ward", e.target.value)}
                placeholder="Phường / Xã"
              />
            </Field>
            <Field label="Ghi chú">
              <Input value={form.note || ""} onChange={(e) => set("note", e.target.value)} />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bỏ qua
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Helper nhỏ: giữ layout nhịp nhàng cho từng field */
function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["space-y-1 min-w-0", className].filter(Boolean).join(" ")}>
      <Label className="text-[13px]">{label}</Label>
      {children}
    </div>
  );
}
