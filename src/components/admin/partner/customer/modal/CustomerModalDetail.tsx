"use client";

import React, { useEffect, useState } from "react";
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

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  province?: string;
  district?: string;
  ward?: string;
};

type FormErrors = Partial<Record<keyof CustomerForm, string>>;

export default function CustomerDetailModal({ open, setOpen, customerId }: Props) {
  const detailQ = useCustomerDetail(customerId ?? undefined);
  const invoicesQ = useCustomerInvoices(customerId ?? undefined, 1, 10);
  const updateMu = useUpdateCustomer();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CustomerForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
    province: "",
    district: "",
    ward: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // fill form khi mở / đổi khách
  useEffect(() => {
    if (detailQ.data && !editing) {
      setForm({
        name: detailQ.data.name ?? "",
        phone: detailQ.data.phone ?? "",
        email: detailQ.data.email ?? "",
        address: detailQ.data.address ?? "",
        province: detailQ.data.province ?? "",
        district: detailQ.data.district ?? "",
        ward: detailQ.data.ward ?? "",
      });
      setErrors({});
    }
  }, [detailQ.data, editing]);

  const validateForm = (f: CustomerForm): FormErrors => {
    const e: FormErrors = {};
    const name = f.name?.trim();
    const phone = f.phone?.trim();
    const email = f.email?.trim();

    if (!name) e.name = "Tên không được để trống";

    if (phone && !/^0[3|5|7|8|9][0-9]{8}$/.test(phone)) {
  e.phone = "Số điện thoại không hợp lệ (10 số)";
}

    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      e.email = "Email không hợp lệ";
    }

    return e;
  };

  const onSave = async () => {
    if (!customerId) return;

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return; // không call BE nếu form lỗi

    await updateMu.mutateAsync({ id: customerId, payload: form });
    setEditing(false);
  };

  const onChangeField =
    (field: keyof CustomerForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((s) => ({ ...s, [field]: value }));
      // clear error khi user sửa lại
      if (errors[field]) {
        setErrors((err) => ({ ...err, [field]: undefined }));
      }
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết khách hàng</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info">Thông tin</TabsTrigger>
              <TabsTrigger value="history">Lịch sử</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              {detailQ.isLoading ? (
                <div>Đang tải…</div>
              ) : detailQ.error ? (
                <div className="text-red-600">{String(detailQ.error)}</div>
              ) : (
                <div className="space-y-3">
                  {!editing ? (
                    <div>
                      <div>
                        <b>Tên:</b> {detailQ.data?.name}
                      </div>
                      <div>
                        <b>Phone:</b> {detailQ.data?.phone ?? "-"}
                      </div>
                      <div>
                        <b>Email:</b> {detailQ.data?.email ?? "-"}
                      </div>
                      <div>
                        <b>Địa chỉ:</b> {detailQ.data?.address ?? "-"}
                      </div>
                      <div className="mt-2">
                        <Button onClick={() => setEditing(true)}>Sửa</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label>Tên</Label>
                        <Input value={form.name} onChange={onChangeField("name")} />
                        {errors.name && (
                          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                        )}
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={form.phone} onChange={onChangeField("phone")} />
                        {errors.phone && (
                          <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                        )}
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={form.email} onChange={onChangeField("email")} />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                        )}
                      </div>
                      <div>
                        <Label>Địa chỉ</Label>
                        <Input value={form.address} onChange={onChangeField("address")} />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditing(false);
                            if (detailQ.data) {
                              setForm({
                                name: detailQ.data.name ?? "",
                                phone: detailQ.data.phone ?? "",
                                email: detailQ.data.email ?? "",
                                address: detailQ.data.address ?? "",
                                province: detailQ.data.province ?? "",
                                district: detailQ.data.district ?? "",
                                ward: detailQ.data.ward ?? "",
                              });
                            }
                            setErrors({});
                          }}
                        >
                          Hủy
                        </Button>
                        <Button onClick={onSave} disabled={updateMu.isPending}>
                          {updateMu.isPending ? "Đang lưu..." : "Lưu"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* History giữ nguyên */}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
