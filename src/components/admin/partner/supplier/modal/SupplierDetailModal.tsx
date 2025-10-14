// components/suppliers/SupplierDetailModal.tsx
"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
import { useSupplierGroups } from "@/hooks/admin/useSupplierGroup";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import CreateSupplierGroupModal from "@/components/admin/partner/supplier/supplier-group/modal/CreaGroupSupplier";

type Props = { open: boolean; onOpenChange: (v: boolean) => void; id?: string };
const ALL = "__ALL__";

export default function SupplierDetailModal({ open, onOpenChange, id }: Props) {
  const { data, isLoading } = useSupplierDetail(id, open);
  const changeStatus = useChangeSupplierStatus();
  const update = useUpdateSupplier();
  const { groups, isLoading: loadingGroups } = useSupplierGroups({ limit: 10 });

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
        // để undefined khi không gán nhóm
        supplierGroupId: data.supplierGroupId ?? undefined,
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

  // tên nhóm để hiển thị (ưu tiên data.supplierGroup, fallback tra theo id từ list groups)
  const groupName =
    data?.supplierGroup?.name ??
    groups.find((g) => g.id === (form.supplierGroupId ?? data?.supplierGroupId))?.name ??
    "-";

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
                      {displayValue((data as any)?.[f.key])}
                    </div>
                  )}
                </Field>
              ))}

              {/* --- NHÓM NCC --- */}
              <Field label="Nhóm NCC" className="col-span-2">
                {edit ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={form.supplierGroupId ?? ALL}
                      onValueChange={(v) =>
                        set("supplierGroupId", v === ALL ? undefined : v)
                      }
                      disabled={loadingGroups}
                    >
                      <SelectTrigger className="w-[340px]">
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
                ) : (
                  <div className="h-9 px-3 flex items-center rounded-md border bg-muted/20">
                    {groupName}
                  </div>
                )}
              </Field>

              {/* Ghi chú full width */}
              <Field className="col-span-2" label="Ghi chú">
                {edit ? (
                  <Input
                    value={form.note ?? ""}
                    onChange={(e) => set("note", e.target.value)}
                  />
                ) : (
                  <div className="h-9 px-3 flex items-center rounded-md border bg-muted/20">
                    {displayValue(data.note)}
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

// các field text thường
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
  // BỎ supplierGroupId ở đây vì đã làm block riêng có Select
];

// helper hiển thị giá trị trong view mode
function displayValue(v: any) {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "object") {
    if ("name" in v) return (v as any).name ?? "-";
    try {
      return JSON.stringify(v);
    } catch {
      return "-";
    }
  }
  return String(v);
}
