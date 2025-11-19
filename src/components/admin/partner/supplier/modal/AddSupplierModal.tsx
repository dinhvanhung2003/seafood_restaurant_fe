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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

import { useCreateSupplier } from "@/hooks/admin/useSupplier";
import { useSupplierGroups } from "@/hooks/admin/useSupplierGroup";
import CreateSupplierGroupModal from "@/components/admin/partner/supplier/supplier-group/modal/CreaGroupSupplier";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

type Form = {
  name: string;
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

type Errors = {
  name?: string;
  phone?: string;
  email?: string;
};

const ALL = "__ALL__";

export default function AddSupplierModal({ open, onOpenChange }: Props) {
  const create = useCreateSupplier();
  const { groups, isLoading } = useSupplierGroups({ limit: 10 });

  const [form, setForm] = React.useState<Form>({
    name: "",
    status: "ACTIVE",
  });
  const [errors, setErrors] = React.useState<Errors>({});

  const resetForm = () => {
    setForm({ name: "", status: "ACTIVE" });
    setErrors({});
  };

  React.useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const set = (k: keyof Form, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const validate = (): boolean => {
    const nextErrors: Errors = {};

    const name = form.name.trim();
    if (!name) {
      nextErrors.name = "Tên nhà cung cấp là bắt buộc";
    } else if (name.length > 50) {
      nextErrors.name = "Tên nhà cung cấp tối đa 50 ký tự";
    }

    // Phone: BẮT BUỘC nhập
    const phone = (form.phone ?? "").trim();
    if (!phone) {
      nextErrors.phone = "Số điện thoại là bắt buộc";
    } else {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(phone)) {
        nextErrors.phone =
          "Số điện thoại không hợp lệ (bắt đầu 0 hoặc +84, 10–11 số)";
      }
    }

    const email = form.email?.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        nextErrors.email = "Email không hợp lệ";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: any = {
      name: form.name.trim(),
      status: form.status,
    };

    (
      [
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
      const raw = form[k];
      const v = typeof raw === "string" ? raw.trim() : raw;
      if (v !== undefined && v !== "") {
        payload[k] = v;
      }
    });

    try {
      await create.mutateAsync(payload);
      toast.success("Tạo nhà cung cấp thành công");
      onOpenChange(false);
      resetForm();
    } catch (e: any) {
      // lỗi đã được hook xử lý toast, ở đây chỉ đảm bảo không crash
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Thêm nhà cung cấp</DialogTitle>
        </DialogHeader>

        {/* layout 2 cột */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tên nhà cung cấp" error={errors.name} required>
            <Input
              value={form.name}
              maxLength={50}
              onChange={(e) => {
                set("name", e.target.value);
                if (errors.name)
                  setErrors((er) => ({ ...er, name: undefined }));
              }}
              className={errors.name ? "border-destructive" : ""}
            />
          </Field>

          <Field label="Công ty">
            <Input
              value={form.company ?? ""}
              maxLength={100}
              onChange={(e) => set("company", e.target.value)}
            />
          </Field>
          <Field label="Mã số thuế">
            <Input
              value={form.taxCode ?? ""}
              maxLength={20}
              onChange={(e) => set("taxCode", e.target.value)}
            />
          </Field>

          <Field label="Điện thoại" error={errors.phone} required>
            <Input
              value={form.phone ?? ""}
              maxLength={15}
              required
              onChange={(e) => {
                set("phone", e.target.value);
                if (errors.phone)
                  setErrors((er) => ({ ...er, phone: undefined }));
              }}
              className={errors.phone ? "border-destructive" : ""}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={form.email ?? ""}
              maxLength={100}
              onChange={(e) => {
                set("email", e.target.value);
                if (errors.email)
                  setErrors((er) => ({ ...er, email: undefined }));
              }}
              className={errors.email ? "border-destructive" : ""}
            />
          </Field>

          <Field label="Địa chỉ">
            <Input
              value={form.address ?? ""}
              maxLength={255}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="Thành phố">
            <Input
              value={form.city ?? ""}
              maxLength={100}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>

          <Field label="Quận / Huyện">
            <Input
              value={form.district ?? ""}
              maxLength={100}
              onChange={(e) => set("district", e.target.value)}
            />
          </Field>
          <Field label="Phường / Xã">
            <Input
              value={form.ward ?? ""}
              maxLength={100}
              onChange={(e) => set("ward", e.target.value)}
            />
          </Field>

          {/* Nhóm NCC */}
          <Field label="Nhóm NCC" className="col-span-2">
            <div className="flex items-center gap-2">
              <Select
                value={form.supplierGroupId ?? ALL}
                onValueChange={(v) =>
                  set("supplierGroupId", v === ALL ? undefined : v)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-[320px]">
                  <SelectValue placeholder="Chọn nhóm" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[10000] max-h-64">
                  <SelectItem value={ALL}>Không gán nhóm</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <CreateSupplierGroupModal
                triggerAs="button"
                onSuccess={(newId) => {
                  if (newId) set("supplierGroupId", newId);
                }}
              />
            </div>
          </Field>

          <Field label="Ghi chú" className="col-span-2">
            <Input
              value={form.note ?? ""}
              maxLength={255}
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
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
          >
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
  error,
  required,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const labelCls = ["text-[13px] flex items-center gap-0.5"];
  if (error) labelCls.push("text-destructive");

  return (
    <div className={["space-y-1", className].filter(Boolean).join(" ")}>
      <Label className={labelCls.join(" ")}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
