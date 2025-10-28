"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

// Hooks cashbook
import {
  useCashTypes,
  useOtherParties,
  useCreateCashbookEntry,
} from "@/hooks/admin/useCashBook";

// Hooks đối tượng
import useEmployee from "@/hooks/admin/useEmployee";
import { useSuppliers } from "@/hooks/admin/useSupplier";
import { useCustomers } from "@/hooks/admin/useCustomer"; // đổi path cho khớp file bạn

// Modal phụ
import { CreateCashTypeModal } from "./CreateCashTypeModal";
import { OtherPartyCreateModal } from "./OrderPartyCreateModal";

type Props = { open: boolean; onOpenChange: (v: boolean) => void; onSuccess?: () => void };

export function CashBookCreateModal({ open, onOpenChange, onSuccess }: Props) {
  const [form, setForm] = React.useState({
    type: "RECEIPT",
    date: new Date().toISOString().slice(0, 10),
    cashTypeId: "",
    amount: "",
    counterpartyGroup: "CUSTOMER" as "CUSTOMER" | "SUPPLIER" | "STAFF" | "DELIVERY_PARTNER" | "OTHER",
    customerId: "",
    supplierId: "",
    staffId: "",
    cashOtherPartyId: "",
    counterpartyName: "",
  });

  // tìm kiếm select (optional)
  const [qCustomer, setQCustomer] = React.useState("");
  const [qSupplier, setQSupplier] = React.useState("");
  const [qStaff, setQStaff] = React.useState("");

  const [openCashType, setOpenCashType] = React.useState(false);
  const [openOtherParty, setOpenOtherParty] = React.useState(false);

  // 1) Danh sách loại thu/chi
  const { data: cashTypes } = useCashTypes();

  // 2) Danh sách Other Party
  const { data: others } = useOtherParties();

  // 3) Danh sách khách hàng
  const { data: customerResp } = useCustomers(1, 20, { q: qCustomer } as any);
  const customers: Array<{ id: string; name: string }> =
    (customerResp?.data ?? customerResp?.items ?? customerResp ?? []).map((c: any) => ({
      id: c.id,
      name: c.fullName || c.name || c.phoneNumber || "Khách hàng",
    }));

  // 4) Danh sách nhà cung cấp
  const { data: supplierResp } = useSuppliers(1, 20, { q: qSupplier } as any);
  const suppliers: Array<{ id: string; name: string }> =
    (supplierResp?.data ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
    }));

  // 5) Danh sách nhân viên
  const { rows: staffRows } = useEmployee(1, 20, qStaff);
  const staffs: Array<{ id: string; name: string }> = staffRows.map((r) => ({
    id: r.id,
    name: r.fullName || r.username || r.email,
  }));

  const createEntry = useCreateCashbookEntry();

  const handleSave = async () => {
    // validate tối thiểu theo nhóm
    const g = form.counterpartyGroup;
    if (g === "CUSTOMER" && !form.customerId) return toast.error("Chọn khách hàng");
    if (g === "SUPPLIER" && !form.supplierId) return toast.error("Chọn nhà cung cấp");
    if (g === "STAFF" && !form.staffId) return toast.error("Chọn nhân viên");
    if (g === "OTHER" && !form.cashOtherPartyId && !form.counterpartyName.trim()) {
      return toast.error("Chọn đối tác khác hoặc nhập tên người nộp/nhận");
    }
    if (!form.cashTypeId) return toast.error("Chọn loại thu/chi");
    if (!form.amount || isNaN(Number(form.amount))) return toast.error("Số tiền không hợp lệ");

    const payload = {
      ...form,
      date: new Date(form.date).toISOString(), // nếu BE nhận "YYYY-MM-DD" cũng OK
      // amount giữ string theo @IsNumberString
    };

    try {
      await createEntry.mutateAsync(payload as any);
      toast.success("Tạo phiếu sổ quỹ thành công!");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err?.response?.data || err);
      toast.error(err?.response?.data?.message || "Tạo phiếu thất bại");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Thêm phiếu sổ quỹ</DialogTitle></DialogHeader>

          <div className="space-y-3 py-2">
            {/* Loại phiếu */}
            <div className="grid gap-1">
              <Label>Loại phiếu</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIPT">Thu (RECEIPT)</SelectItem>
                  <SelectItem value="PAYMENT">Chi (PAYMENT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ngày */}
            <div className="grid gap-1">
              <Label>Ngày</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}/>
            </div>

            {/* Loại thu/chi */}
            <div className="grid gap-1">
              <Label>Loại thu/chi</Label>
              <div className="flex gap-2">
                <Select value={form.cashTypeId} onValueChange={(v) => setForm((f) => ({ ...f, cashTypeId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại thu/chi" /></SelectTrigger>
                  <SelectContent>
                    {(cashTypes ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setOpenCashType(true)}>+</Button>
              </div>
            </div>

            {/* Số tiền */}
            <div className="grid gap-1">
              <Label>Số tiền</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Nhập số tiền"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>

            {/* Nhóm đối tượng */}
            <div className="grid gap-1">
              <Label>Nhóm người nộp/nhận</Label>
              <Select
                value={form.counterpartyGroup}
                onValueChange={(v: any) =>
                  setForm((f) => ({
                    ...f,
                    counterpartyGroup: v,
                    customerId: "",
                    supplierId: "",
                    staffId: "",
                    cashOtherPartyId: "",
                  }))
                }
              >
                <SelectTrigger><SelectValue placeholder="Chọn nhóm" /></SelectTrigger>
               <SelectContent>
  <SelectItem value="CUSTOMER">Khách hàng</SelectItem>
  <SelectItem value="SUPPLIER">Nhà cung cấp</SelectItem>
  <SelectItem value="STAFF">Nhân viên</SelectItem>
  <SelectItem value="DELIVERY_PARTNER">Đối tác vận chuyển</SelectItem>
  <SelectItem value="OTHER">Khác</SelectItem>
</SelectContent>
              </Select>
            </div>

            {/* Theo nhóm: chọn đối tượng */}
            {form.counterpartyGroup === "CUSTOMER" && (
              <div className="grid gap-1">
                <Label>Khách hàng</Label>
                <div className="flex gap-2">
                  <Input placeholder="Tìm khách hàng…" value={qCustomer} onChange={(e)=>setQCustomer(e.target.value)} />
                  <Select value={form.customerId} onValueChange={(v)=>setForm(f=>({...f, customerId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {form.counterpartyGroup === "SUPPLIER" && (
              <div className="grid gap-1">
                <Label>Nhà cung cấp</Label>
                <div className="flex gap-2">
                  <Input placeholder="Tìm NCC…" value={qSupplier} onChange={(e)=>setQSupplier(e.target.value)} />
                  <Select value={form.supplierId} onValueChange={(v)=>setForm(f=>({...f, supplierId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Chọn NCC" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {form.counterpartyGroup === "STAFF" && (
              <div className="grid gap-1">
                <Label>Nhân viên</Label>
                <div className="flex gap-2">
                  <Input placeholder="Tìm nhân viên…" value={qStaff} onChange={(e)=>setQStaff(e.target.value)} />
                  <Select value={form.staffId} onValueChange={(v)=>setForm(f=>({...f, staffId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
                    <SelectContent>
                      {staffs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {form.counterpartyGroup === "OTHER" && (
              <>
                <div className="grid gap-1">
                  <Label>Tên người nộp/nhận</Label>
                  <Input
                    placeholder="Nhập tên (nếu chưa có trong danh sách)"
                    value={form.counterpartyName}
                    onChange={(e) => setForm((f) => ({ ...f, counterpartyName: e.target.value }))}
                  />
                </div>

                <div className="grid gap-1">
                  <Label>Đối tác khác (nếu có)</Label>
                  <div className="flex gap-2">
                    <Select
                      value={form.cashOtherPartyId}
                      onValueChange={(v) => setForm((f) => ({ ...f, cashOtherPartyId: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Chọn đối tác khác" /></SelectTrigger>
                      <SelectContent>
                        {(others ?? []).map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setOpenOtherParty(true)}>+</Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={createEntry.isPending}>Lưu phiếu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateCashTypeModal open={openCashType} onOpenChange={setOpenCashType} />
      <OtherPartyCreateModal open={openOtherParty} onOpenChange={setOpenOtherParty} />
    </>
  );
}
