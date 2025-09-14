// components/suppliers/AddSupplierModal.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateSupplier } from "@/hooks/admin/useSupplier";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

type Form = {
  name: string;
  code?: string;
  company?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  supplierGroupId?: string;
  note?: string;
  status: "ACTIVE" | "INACTIVE";
};

export default function AddSupplierModal({ open, onOpenChange }: Props) {
  const create = useCreateSupplier();

  const [form, setForm] = React.useState<Form>({
    name: "",
    status: "ACTIVE",
  });

  const set = (k: keyof Form, v: any) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.info("Tên nhà cung cấp là bắt buộc");
      return;
    }

    // lọc field rỗng
    const payload: any = { name: form.name.trim(), status: form.status };
    (
      [
        "code",
        "company",
        "taxCode",
        "phone",
        "email",
        "address",
        "city",
        "district",
        "ward",
        "supplierGroupId",
        "note",
      ] as (keyof Form)[]
    ).forEach((k) => {
      const v = form[k];
      if (v !== undefined && v !== "") (payload as any)[k] = v;
    });

    await create.mutateAsync(payload);
    if (!create.isError) {
      onOpenChange(false);
      setForm({ name: "", status: "ACTIVE" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Thêm nhà cung cấp</DialogTitle>
        </DialogHeader>

        {/* layout 2 cột gọn gàng */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tên nhà cung cấp *">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Mã NCC">
            <Input
              placeholder="Tự gen nếu để trống"
              value={form.code ?? ""}
              onChange={(e) => set("code", e.target.value)}
            />
          </Field>

          <Field label="Công ty">
            <Input
              value={form.company ?? ""}
              onChange={(e) => set("company", e.target.value)}
            />
          </Field>
          <Field label="Mã số thuế">
            <Input
              value={form.taxCode ?? ""}
              onChange={(e) => set("taxCode", e.target.value)}
            />
          </Field>

          <Field label="Điện thoại">
            <Input
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>

          <Field label="Địa chỉ">
            <Input
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="Thành phố">
            <Input
              value={form.city ?? ""}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>

          <Field label="Quận / Huyện">
            <Input
              value={form.district ?? ""}
              onChange={(e) => set("district", e.target.value)}
            />
          </Field>
          <Field label="Phường / Xã">
            <Input
              value={form.ward ?? ""}
              onChange={(e) => set("ward", e.target.value)}
            />
          </Field>

          {/* <Field label="Nhóm NCC (ID)">
            <Input
              placeholder="fa4d1702-..."
              value={form.supplierGroupId ?? ""}
              onChange={(e) => set("supplierGroupId", e.target.value)}
            />
          </Field> */}
          <Field label="Ghi chú">
            <Input
              value={form.note ?? ""}
              onChange={(e) => set("note", e.target.value)}
            />
          </Field>

          <div className="col-span-2 space-y-2">
            <Label>Trạng thái</Label>
            <RadioGroup
              value={form.status}
              onValueChange={(v) => set("status", v as Form["status"])}
              className="flex gap-6"
            >
              <label className="flex items-center gap-2">
                <RadioGroupItem value="ACTIVE" /> Đang hoạt động
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="INACTIVE" /> Ngừng hoạt động
              </label>
            </RadioGroup>
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
    <div className={["space-y-1", className].filter(Boolean).join(" ")}>
      <Label className="text-[13px]">{label}</Label>
      {children}
    </div>
  );
}
