"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerDetail, useCustomerInvoices, useUpdateCustomer } from "@/hooks/admin/useCustomer";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  customerId?: string | null;
};

export default function CustomerDetailModal({ open, setOpen, customerId }: Props) {
  const detailQ = useCustomerDetail(customerId ?? undefined);
  const invoicesQ = useCustomerInvoices(customerId ?? undefined, 1, 10);
  const updateMu = useUpdateCustomer();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

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
    }
  }, [detailQ.data, editing]);

  const onSave = async () => {
    if (!customerId) return;
    await updateMu.mutateAsync({ id: customerId, payload: form });
    setEditing(false);
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
              {detailQ.isLoading ? <div>Đang tải…</div> : detailQ.error ? <div className="text-red-600">{String(detailQ.error)}</div> : (
                <div className="space-y-3">
                  {!editing ? (
                    <div>
                      <div><b>Tên:</b> {detailQ.data?.name}</div>
                      <div><b>Phone:</b> {detailQ.data?.phone ?? "-"}</div>
                      <div><b>Email:</b> {detailQ.data?.email ?? "-"}</div>
                      <div><b>Địa chỉ:</b> {detailQ.data?.address ?? "-"}</div>
                      <div className="mt-2">
                        <Button onClick={() => setEditing(true)}>Sửa</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label>Tên</Label>
                        <Input value={form.name} onChange={(e)=>setForm((s:any)=>({...s, name:e.target.value}))}/>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={form.phone} onChange={(e)=>setForm((s:any)=>({...s, phone:e.target.value}))}/>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={form.email} onChange={(e)=>setForm((s:any)=>({...s, email:e.target.value}))}/>
                      </div>
                      <div>
                        <Label>Địa chỉ</Label>
                        <Input value={form.address} onChange={(e)=>setForm((s:any)=>({...s, address:e.target.value}))}/>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={()=>{ setEditing(false); setForm(detailQ.data); }}>Hủy</Button>
                       <Button onClick={onSave} disabled={updateMu.isPending}>
  {updateMu.isPending ? "Đang lưu..." : "Lưu"}
</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {invoicesQ.isLoading ? (
                <div>Đang tải…</div>
              ) : invoicesQ.error ? (
                <div className="text-red-600">Không tải được lịch sử</div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(invoicesQ.data?.items) && invoicesQ.data.items.length > 0 ? (
                    <ul className="divide-y">
                      {invoicesQ.data.items.map((it:any) => (
                        <li key={it.invoiceId} className="py-2">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{it.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground">{new Date(it.time).toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{Number(it.totalAmount).toLocaleString()} ₫</div>
                              <div className="text-sm">{it.status}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">Không có lịch sử</div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={()=>setOpen(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
