// components/suppliers/SupplierDetailModal.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useSupplierDetail,
  useChangeSupplierStatus,
  useUpdateSupplier,
} from "@/hooks/admin/useSupplier";

type Props = { open: boolean; onOpenChange: (v: boolean) => void; id?: string };

export default function SupplierDetailModal({ open, onOpenChange, id }: Props) {
  const { data, isLoading } = useSupplierDetail(id, open);
  const changeStatus = useChangeSupplierStatus();
  const update = useUpdateSupplier();

  const [edit, setEdit] = React.useState(false);
  const [form, setForm] = React.useState<any>({});

  React.useEffect(() => {
    if (data && open) {
      setForm({
        name: data.name ?? "",
        code: data.code ?? "",
        company: data.company ?? "",
        taxCode: data.taxCode ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        district: data.district ?? "",
        ward: data.ward ?? "",
        supplierGroupId: data.supplierGroupId ?? "",
        note: data.note ?? "",
        status: data.status,
      });
      setEdit(false);
    }
  }, [data, open]);

  const set = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!id) return;
    const body: any = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "" && v !== undefined) body[k] = v;
    });
    await update.mutateAsync({ id, body });
    if (!update.isError) setEdit(false);
  };

  const toggleStatus = async () => {
    if (!id || !data) return;
    const next = data.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await changeStatus.mutateAsync({ id, status: next });
  };

  // ---- helper: chuẩn hoá giá trị hiển thị (tránh render object) ----
  const readValue = (k: string): React.ReactNode => {
    const v = (data as any)?.[k];
    if (v === null || v === undefined || v === "") return "-";
    if (typeof v === "object") {
      // trường hợp object như supplierGroup → lấy name nếu có
      if ("name" in v) return (v as any).name ?? "-";
      try {
        return JSON.stringify(v);
      } catch {
        return "-";
      }
    }
    return v as React.ReactNode;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Chi tiết nhà cung cấp</span>
            {data && (
              <Badge variant={data.status === "ACTIVE" ? "default" : "secondary"}>
                {data.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div>Đang tải…</div>
        ) : data ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                Mã: <b>{data.code}</b>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={toggleStatus} disabled={changeStatus.isPending}>
                  {data.status === "ACTIVE" ? "Ngừng hoạt động" : "Kích hoạt"}
                </Button>
                {!edit ? (
                  <Button variant="outline" onClick={() => setEdit(true)}>
                    Sửa
                  </Button>
                ) : (
                  <Button onClick={save} disabled={update.isPending}>
                    {update.isPending ? "Đang lưu..." : "Lưu"}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {fields.map((f) => (
                <Field key={f.key} label={f.label}>
                  {edit ? (
                    <Input
                      value={form[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  ) : (
                    <div className="h-9 px-3 flex items-center rounded-md border bg-muted/20">
                      {readValue(f.key)}
                    </div>
                  )}
                </Field>
              ))}

              {/* Note full width */}
              <Field className="col-span-2" label="Ghi chú">
                {edit ? (
                  <Input
                    value={form.note ?? ""}
                    onChange={(e) => set("note", e.target.value)}
                  />
                ) : (
                  <div className="h-9 px-3 flex items-center rounded-md border bg-muted/20">
                    {readValue("note")}
                  </div>
                )}
              </Field>
            </div>

            <DialogFooter>
              <div className="text-xs text-muted-foreground mr-auto">
                Tạo: {new Date(data.createdAt).toLocaleString()} • Cập nhật:{" "}
                {new Date(data.updatedAt).toLocaleString()}
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              {edit && (
                <Button onClick={save} disabled={update.isPending}>
                  {update.isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <div>Không tìm thấy dữ liệu</div>
        )}
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

const fields: Array<{ key: string; label: string }> = [
  { key: "name", label: "Tên nhà cung cấp" },
  { key: "company", label: "Công ty" },
  { key: "taxCode", label: "Mã số thuế" },
  { key: "phone", label: "Điện thoại" },
  { key: "email", label: "Email" },
  { key: "address", label: "Địa chỉ" },
  { key: "city", label: "Thành phố" },
  { key: "district", label: "Quận / Huyện" },
  { key: "ward", label: "Phường / Xã" },
  // nếu muốn hiển thị tên nhóm từ object:
  // { key: "supplierGroup", label: "Nhóm NCC" },
  { key: "supplierGroupId", label: "Nhóm NCC (ID)" },
];
