"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCustomerDetail,
  useCustomerInvoices,
  useUpdateCustomer,
} from "@/hooks/admin/useCustomer";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  customerId?: string | null;
};

type CustomerType = "PERSONAL" | "COMPANY" | "";
type Gender = "MALE" | "FEMALE" | "OTHER" | "";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;

  type: CustomerType;
  gender: Gender;
  birthday: string; // yyyy-mm-dd

  address: string;
  province: string;
  district: string;
  ward: string;

  companyName: string;
  taxNo: string;
  identityNo: string;

  notes: string;
};

type FormErrors = Partial<Record<keyof CustomerForm, string>>;

const EMPTY_FORM: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  type: "",
  gender: "",
  birthday: "",
  address: "",
  province: "",
  district: "",
  ward: "",
  companyName: "",
  taxNo: "",
  identityNo: "",
  notes: "",
};

function toYmd(d: any) {
  if (!d) return "";
  try {
    const s = String(d);
    if (s.includes("T")) return s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dd = new Date(d);
    if (isNaN(dd.getTime())) return "";
    return dd.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function CustomerDetailModal({
  open,
  setOpen,
  customerId,
}: Props) {
  const detailQ = useCustomerDetail(customerId ?? undefined);
  const invoicesQ = useCustomerInvoices(customerId ?? undefined, 1, 10);
  const updateMu = useUpdateCustomer();

  const [tab, setTab] = useState<"info" | "history">("info");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const current = detailQ.data;

  const canCompanyFields = useMemo(() => form.type === "COMPANY", [form.type]);

  // fill form khi mở / đổi khách (chỉ khi không editing)
  useEffect(() => {
    if (!open) return;
    if (!current) return;
    if (editing) return;

    setForm({
      name: current.name ?? "",
      phone: current.phone ?? "",
      email: current.email ?? "",
      type: (current.type ?? "") as CustomerType,
      gender: (current.gender ?? "") as Gender,
      birthday: toYmd(current.birthday),
      address: current.address ?? "",
      province: current.province ?? "",
      district: current.district ?? "",
      ward: current.ward ?? "",
      companyName: current.companyName ?? "",
      taxNo: current.taxNo ?? "",
      identityNo: current.identityNo ?? "",
      notes: current.notes ?? "",
    });
    setErrors({});
  }, [open, current, editing]);

  // khi đóng modal thì reset editing/tab
  useEffect(() => {
    if (!open) {
      setEditing(false);
      setTab("info");
      setErrors({});
      setForm(EMPTY_FORM);
    }
  }, [open]);

  const validateForm = (f: CustomerForm): FormErrors => {
    const e: FormErrors = {};
    const name = f.name.trim();
    const phone = f.phone.trim();
    const email = f.email.trim();

    if (!name) e.name = "Tên không được để trống";

    if (phone && !/^0(3|5|7|8|9)\d{8}$/.test(phone)) {
      e.phone = "Số điện thoại không hợp lệ (10 số)";
    }

    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      e.email = "Email không hợp lệ";
    }

    if (f.type === "COMPANY" && !f.companyName.trim()) {
      e.companyName = "Vui lòng nhập tên công ty";
    }

    return e;
  };

  const onChange =
    (field: keyof CustomerForm) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      const value = e.target.value;
      setForm((s) => ({ ...s, [field]: value }));
      if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    };

  const resetToCurrent = () => {
    if (!current) return;
    setForm({
      name: current.name ?? "",
      phone: current.phone ?? "",
      email: current.email ?? "",
      type: (current.type ?? "") as CustomerType,
      gender: (current.gender ?? "") as Gender,
      birthday: toYmd(current.birthday),
      address: current.address ?? "",
      province: current.province ?? "",
      district: current.district ?? "",
      ward: current.ward ?? "",
      companyName: current.companyName ?? "",
      taxNo: current.taxNo ?? "",
      identityNo: current.identityNo ?? "",
      notes: current.notes ?? "",
    });
    setErrors({});
  };

  const onSave = async () => {
    if (!customerId) return;

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // payload match UpdateCustomerDto
    const payload: any = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,

      type: form.type || null,
      gender: form.gender || null,
      birthday: form.birthday || null,

      address: form.address.trim() || null,
      province: form.province.trim() || null,
      district: form.district.trim() || null,
      ward: form.ward.trim() || null,

      identityNo: form.identityNo.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (form.type === "COMPANY") {
      payload.companyName = form.companyName.trim() || null;
      payload.taxNo = form.taxNo.trim() || null;
    } else {
      payload.companyName = null;
      payload.taxNo = null;
    }

    await updateMu.mutateAsync({ id: customerId, payload });

    setEditing(false);
  };

  const footerLeftHint = useMemo(() => {
    if (!editing) return null;
    if (updateMu.isPending) return "Đang lưu...";
    return "Nhớ kiểm tra số điện thoại / email trước khi lưu.";
  }, [editing, updateMu.isPending]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
      }}
    >
     <DialogContent
  className="
    w-[calc(100vw-24px)]
    sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl
    max-h-[calc(100vh-24px)]
    p-0
    flex flex-col
  "
>
       <DialogHeader className="px-6 pt-6">
    <DialogTitle>Chi tiết khách hàng</DialogTitle>
  </DialogHeader>


        {/* ====== Layout chống tràn chiều dọc ====== */}
        <div className="flex flex-col h-[calc(100vh-140px)] sm:h-auto min-h-0">
          {/* Nội dung cuộn */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList>
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="history">Lịch sử</TabsTrigger>
              </TabsList>

              {/* ================= INFO ================= */}
              <TabsContent value="info">
                {detailQ.isLoading ? (
                  <div>Đang tải…</div>
                ) : detailQ.error ? (
                  <div className="text-red-600">{String(detailQ.error)}</div>
                ) : !current ? (
                  <div className="text-muted-foreground">Không có dữ liệu</div>
                ) : (
                  <div className="space-y-4">
                    {!editing ? (
                      <div className="space-y-2">
                        <div>
                          <b>Tên:</b> {current.name}
                        </div>
                        <div>
                          <b>Phone:</b> {current.phone ?? "-"}
                        </div>
                        <div>
                          <b>Email:</b> {current.email ?? "-"}
                        </div>
                        <div>
                          <b>Loại khách:</b> {current.type ?? "-"}
                        </div>
                        <div>
                          <b>Giới tính:</b> {current.gender ?? "-"}
                        </div>
                        <div>
                          <b>Ngày sinh:</b> {toYmd(current.birthday) || "-"}
                        </div>
                        <div>
                          <b>Địa chỉ:</b> {current.address ?? "-"}
                        </div>
                        <div>
                          <b>Tỉnh/TP:</b> {current.province ?? "-"}
                        </div>
                        <div>
                          <b>Quận/Huyện:</b> {current.district ?? "-"}
                        </div>
                        <div>
                          <b>Phường/Xã:</b> {current.ward ?? "-"}
                        </div>
                        <div>
                          <b>Công ty:</b> {current.companyName ?? "-"}
                        </div>
                        <div>
                          <b>MST:</b> {current.taxNo ?? "-"}
                        </div>
                        <div>
                          <b>CCCD/CMND:</b> {current.identityNo ?? "-"}
                        </div>
                        <div>
                          <b>Ghi chú:</b> {current.notes ?? "-"}
                        </div>

                        <div className="pt-2">
                          <Button onClick={() => setEditing(true)}>Sửa</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label>Tên</Label>
                            <Input value={form.name} onChange={onChange("name")} />
                            {errors.name && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors.name}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Phone</Label>
                            <Input value={form.phone} onChange={onChange("phone")} />
                            {errors.phone && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors.phone}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Email</Label>
                            <Input value={form.email} onChange={onChange("email")} />
                            {errors.email && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors.email}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Loại khách</Label>
                            <Select
                              value={form.type}
                              onValueChange={(v) =>
                                setForm((s) => ({ ...s, type: v as CustomerType }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại khách" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PERSONAL">Cá nhân</SelectItem>
                                <SelectItem value="COMPANY">Công ty</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Giới tính</Label>
                            <Select
                              value={form.gender}
                              onValueChange={(v) =>
                                setForm((s) => ({ ...s, gender: v as Gender }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn giới tính" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MALE">Nam</SelectItem>
                                <SelectItem value="FEMALE">Nữ</SelectItem>
                                <SelectItem value="OTHER">Khác</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Ngày sinh</Label>
                            <Input
                              type="date"
                              value={form.birthday}
                              onChange={onChange("birthday")}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label>Địa chỉ</Label>
                            <Input
                              value={form.address}
                              onChange={onChange("address")}
                            />
                          </div>

                          <div>
                            <Label>Tỉnh/TP</Label>
                            <Input
                              value={form.province}
                              onChange={onChange("province")}
                            />
                          </div>

                          <div>
                            <Label>Quận/Huyện</Label>
                            <Input
                              value={form.district}
                              onChange={onChange("district")}
                            />
                          </div>

                          <div>
                            <Label>Phường/Xã</Label>
                            <Input value={form.ward} onChange={onChange("ward")} />
                          </div>

                          <div className="md:col-span-2">
                            <div className="rounded-md border p-4 space-y-3">
                              <div className="font-medium">Thông tin công ty / thuế</div>

                              <div>
                                <Label>Tên công ty</Label>
                                <Input
                                  value={form.companyName}
                                  onChange={onChange("companyName")}
                                  disabled={!canCompanyFields}
                                />
                                {errors.companyName && (
                                  <p className="mt-1 text-xs text-red-500">
                                    {errors.companyName}
                                  </p>
                                )}
                                {!canCompanyFields && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Chỉ dùng cho khách loại “Công ty”.
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label>Mã số thuế</Label>
                                <Input
                                  value={form.taxNo}
                                  onChange={onChange("taxNo")}
                                  disabled={!canCompanyFields}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <Label>CCCD/CMND</Label>
                            <Input
                              value={form.identityNo}
                              onChange={onChange("identityNo")}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label>Ghi chú</Label>
                            <Textarea
                              value={form.notes}
                              onChange={onChange("notes")}
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ================= HISTORY ================= */}
              <TabsContent value="history">
                {invoicesQ.isLoading ? (
                  <div>Đang tải…</div>
                ) : invoicesQ.error ? (
                  <div className="text-red-600">Không tải được lịch sử</div>
                ) : (
                  <div className="space-y-2">
                    {Array.isArray(invoicesQ.data?.items) &&
                    invoicesQ.data.items.length > 0 ? (
                      <ul className="divide-y">
                        {invoicesQ.data.items.map((it: any) => (
                          <li key={it.invoiceId} className="py-2">
                            <div className="flex justify-between">
                              <div>
                                <div className="font-medium">{it.invoiceNumber}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(it.time).toLocaleString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {Number(it.totalAmount).toLocaleString()} ₫
                                </div>
                                <div className="text-sm">{it.status}</div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Không có lịch sử
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer cố định (luôn thấy) */}
           <DialogFooter className="px-6 py-4 border-t bg-background">
            <div className="text-xs text-muted-foreground">{footerLeftHint}</div>

            {!editing ? (
              <Button variant="outline" onClick={() => setOpen(false)}>
                Đóng
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    resetToCurrent();
                  }}
                  disabled={updateMu.isPending}
                >
                  Hủy
                </Button>
                <Button onClick={onSave} disabled={updateMu.isPending}>
                  {updateMu.isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
