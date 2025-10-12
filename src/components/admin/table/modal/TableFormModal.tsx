"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTableTransactions } from "@/hooks/admin/useTable";

type Status = "active" | "inactive";

export type Area = { id: string; name: string; };
export type TableFormState = {
  id?: string;
  name: string;
  areaId: string;
  seats?: number;
  note?: string;
  status: Status;
  order?: number;
};

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  form: TableFormState;
  setForm: Dispatch<SetStateAction<TableFormState>>;
  handleSubmit: () => void;
  areas: Area[];
  editing: boolean;
};

function fmtMoney(v: string | number) {
  const n = typeof v === "string" ? Number(v) : v;
  return n.toLocaleString("vi-VN");
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN");
}

export default function TableFormModal({
  open, setOpen, form, setForm, handleSubmit, areas, editing,
}: Props) {
  // state riêng cho tab lịch sử
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { data, isFetching, error } = useTableTransactions(form.id ?? "", {
    page, limit, status,
  });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { total: 0, page, limit, pages: 1 };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[92vw] !max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Cập nhật" : "Thêm phòng/bàn"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-2">
          <TabsList>
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="history" disabled={!form.id}>
              Lịch sử giao dịch
            </TabsTrigger>
          </TabsList>

          {/* TAB THÔNG TIN */}
          <TabsContent value="info" className="mt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-1 block">Tên phòng/bàn</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="VD: Bàn 20"
                />
              </div>
              <div>
                <Label className="mb-1 block">Khu vực</Label>
                <Select
                  value={form.areaId}
                  onValueChange={(v) => setForm((s) => ({ ...s, areaId: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn khu vực" /></SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border border-border shadow-md">
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">Số ghế</Label>
                <Input
                  type="number"
                  value={form.seats ?? 0}
                  onChange={(e) => setForm((s) => ({ ...s, seats: Number(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label className="mb-1 block">Số thứ tự</Label>
                <Input
                  type="number"
                  value={form.order ?? 0}
                  onChange={(e) => setForm((s) => ({ ...s, order: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1 block">Ghi chú</Label>
                <Input
                  value={form.note ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                  placeholder="Ghi chú..."
                />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Trạng thái</Label>
                <RadioGroup
                  className="flex gap-6"
                  value={form.status}
                  onValueChange={(v) => setForm((s) => ({ ...s, status: v as Status }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="stf1" value="active" />
                    <Label htmlFor="stf1">Đang hoạt động</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="stf2" value="inactive" />
                    <Label htmlFor="stf2">Ngừng hoạt động</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmit}>{editing ? "Lưu thay đổi" : "Tạo mới"}</Button>
            </DialogFooter>
          </TabsContent>

          {/* TAB LỊCH SỬ GIAO DỊCH */}
          <TabsContent value="history" className="mt-4">
            {!form.id ? (
              <div className="text-sm text-muted-foreground">
                Chưa có dữ liệu (bàn mới chưa được tạo).
              </div>
            ) : (
              <div className="space-y-3">
                {/* filters nhỏ */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-44">
                    <Select
                      value={status ?? "ALL"}
                      onValueChange={(v) => { setPage(1); setStatus(v === "ALL" ? undefined : v); }}
                    >
                      <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tất cả</SelectItem>
                        <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
                        <SelectItem value="PAID">Đã thanh toán</SelectItem>
                        <SelectItem value="VOID">Huỷ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Select
                      value={String(limit)}
                      onValueChange={(v) => { setPage(1); setLimit(Number(v)); }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[5, 10, 20].map(n => <SelectItem key={n} value={String(n)}>{n}/trang</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-[18%]">Mã hóa đơn</TableHead>
                        <TableHead className="w-[18%]">Thời gian</TableHead>
                        <TableHead className="w-[26%]">Người tạo</TableHead>
                        <TableHead className="w-[26%]">Người nhận đơn</TableHead>
                        <TableHead className="w-[12%]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {error ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-red-600">
                            {(error as any)?.message ?? "Có lỗi xảy ra"}
                          </TableCell>
                        </TableRow>
                      ) : isFetching && !data ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell className="animate-pulse h-6 bg-slate-100" />
                            <TableCell className="animate-pulse h-6 bg-slate-100" />
                            <TableCell className="animate-pulse h-6 bg-slate-100" />
                            <TableCell className="animate-pulse h-6 bg-slate-100" />
                            <TableCell className="animate-pulse h-6 bg-slate-100" />
                          </TableRow>
                        ))
                      ) : (items.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                            Không có dữ liệu
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map(r => (
                          <TableRow key={r.invoiceId}>
                            <TableCell>
                              <div className="font-medium">{r.invoiceNumber}</div>
                              <div className="mt-1"><Badge variant="outline">{r.status}</Badge></div>
                            </TableCell>
                            <TableCell>{fmtDate(r.createdAt)}</TableCell>
                            <TableCell>{r.cashier?.name ?? r.cashier?.id ?? "—"}</TableCell>
                            <TableCell>{r.orderedBy?.name ?? r.orderedBy?.id ?? "—"}</TableCell>
                            <TableCell className="text-right font-medium">
                              {fmtMoney(r.totalAmount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Tổng {meta.total} hóa đơn · Trang {meta.page}/{meta.pages || 1}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || isFetching}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Trước
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage((p) => Math.min(meta.pages || 1, p + 1))}
                      disabled={page >= (meta.pages || 1) || isFetching}
                    >
                      Sau <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
