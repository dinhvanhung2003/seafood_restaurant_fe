"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePayrollDetail, usePayPayroll } from "@/hooks/admin/usePayroll";
import { toast } from "sonner";
import { AppDialogContent } from "@/components/common/AppDialogContent";
type Props = {
  payrollId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PayPayrollDialog({
  payrollId,
  open,
  onOpenChange,
}: Props) {
  const { data: payroll, isLoading } = usePayrollDetail(payrollId);
  const payMutation = usePayPayroll();

  const [payDate, setPayDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [method, setMethod] = useState<"CASH" | "BANK">("CASH");
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && payroll?.slips) {
      const ids = payroll.slips
        .filter((s) => Number(s.remainingAmount) > 0)
        .map((s) => s.id);
      setSelected(ids);
    }
  }, [open, payroll]);

  const totalToPay = useMemo(() => {
    if (!payroll?.slips) return 0;
    return payroll.slips
      .filter((s) => selected.includes(s.id))
      .reduce((sum, s) => sum + Number(s.remainingAmount), 0);
  }, [payroll, selected]);

  const handleToggle = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handlePay = () => {
    if (!payrollId) return;
    if (!selected.length) {
      toast.error("Chọn ít nhất 1 phiếu lương để thanh toán");
      return;
    }
    payMutation.mutate(
      {
        payrollId,
        payDate,
        method,
        note: note || undefined,
        slipIds: selected,
      },
      {
        onSuccess(res) {
          toast.success(`Đã thanh toán ${res.paid.toLocaleString()} đ`);
          onOpenChange(false);
        },
        onError(err: any) {
          toast.error(err?.message || "Thanh toán bảng lương thất bại");
        },
      }
    );
  };

  const isPending = payMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <AppDialogContent className="sm:max-w-[900px] p-6">   
        
        <DialogHeader>
          <DialogTitle>
            Thanh toán bảng lương{" "}
            {payroll ? `${payroll.name} (${payroll.code})` : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !payroll ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Đang tải dữ liệu bảng lương...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm">
              <div>
                Kỳ làm việc:{" "}
                <b>
                  {payroll.workDateFrom} - {payroll.workDateTo}
                </b>
              </div>
              <div>
                Tổng lương:{" "}
                <b>{Number(payroll.totalAmount).toLocaleString()} đ</b> • Đã
                trả:{" "}
                <b>{Number(payroll.paidAmount).toLocaleString()} đ</b> • Còn
                cần trả:{" "}
                <b>{Number(payroll.remainingAmount).toLocaleString()} đ</b>
              </div>
            </div>

            {/* Form thanh toán */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Thời gian</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Phương thức</Label>
                <select
                  className="border rounded px-2 py-2 text-sm w-full"
                  value={method}
                  onChange={(e) =>
                    setMethod(e.target.value as "CASH" | "BANK")
                  }
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK">Chuyển khoản</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú phiếu chi (nếu có)"
                />
              </div>
            </div>

            {/* Phiếu lương */}
            <div className="border rounded-md overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-2 py-2 w-10">
                      <Checkbox
                
                         checked={
  payroll.slips?.every(
    (s) =>
      Number(s.remainingAmount) <= 0 ||
      selected.includes(s.id)
  ) && selected.length > 0
}

                        onCheckedChange={(checked) => {
                          if (checked) {
                            const ids = payroll.slips
                              ?.filter((s) => Number(s.remainingAmount) > 0)
                              .map((s) => s.id) ?? [];
                            setSelected(ids);
                          } else {
                            setSelected([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-2 py-2 text-left">Mã phiếu</th>
                    <th className="px-2 py-2 text-left">Nhân viên</th>
                    <th className="px-2 py-2 text-right">Tổng lương</th>
                    <th className="px-2 py-2 text-right">Đã trả</th>
                    <th className="px-2 py-2 text-right">Còn cần trả</th>
                    <th className="px-2 py-2 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.slips?.map((s) => {
                    const remaining = Number(s.remainingAmount);
                    const disabled = remaining <= 0;
                    const fullName =
                      (s.staff as any).profile?.fullName ??
                      s.staff.email ??
                      "Nhân viên";
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="px-2 py-2 text-center">
                          <Checkbox
                            disabled={disabled}
                            checked={selected.includes(s.id)}
                            onCheckedChange={(checked) =>
                              handleToggle(s.id, !!checked)
                            }
                          />
                        </td>
                        <td className="px-2 py-2">{s.code}</td>
                        <td className="px-2 py-2">{fullName}</td>
                        <td className="px-2 py-2 text-right">
                          {Number(s.totalAmount).toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {Number(s.paidAmount).toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {remaining.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-center">{s.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                Tiền trả nhân viên:{" "}
                <b>{totalToPay.toLocaleString()} đ</b> (
                {selected.length} phiếu)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Bỏ qua
                </Button>
                <Button onClick={handlePay} disabled={isPending}>
                  {isPending ? "Đang tạo phiếu chi..." : "Tạo phiếu chi"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </AppDialogContent>
   
    </Dialog>
  );
}
