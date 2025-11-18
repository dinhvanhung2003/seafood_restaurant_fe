"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePayrollList } from "@/hooks/admin/usePayroll";
import CreatePayrollDialog from "@/components/admin/payroll/modal/CreatePayrollDialog";
import PayPayrollDialog from "@/components/admin/payroll/modal/PayPayrollDialog";

export default function PayrollPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");

  const { data, isLoading } = usePayrollList(page, limit, q);
  const items = data?.items ?? [];
  const meta = data?.meta ?? { total: 0, page, pages: 1, limit };
const [openCreate, setOpenCreate] = useState(false);

  const [payrollId, setPayrollId] = useState<string | undefined>();
  const [openPay, setOpenPay] = useState(false);

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.pages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bảng lương</h1>
      <CreatePayrollDialog
  open={openCreate}
  onOpenChange={setOpenCreate}
/>
 <div className="flex justify-between mb-4">
      
        <Button onClick={() => setOpenCreate(true)}>Tạo bảng lương</Button>
      </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="max-w-lg flex-1">
          <Input
            placeholder="Theo mã, tên bảng lương..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">Mã</th>
              <th className="px-3 py-2 text-left">Tên</th>
              <th className="px-3 py-2 text-left">Kỳ hạn trả</th>
              <th className="px-3 py-2 text-left">Kỳ làm việc</th>
              <th className="px-3 py-2 text-right">Tổng lương</th>
              <th className="px-3 py-2 text-right">Đã trả</th>
              <th className="px-3 py-2 text-right">Còn cần trả</th>
              <th className="px-3 py-2 text-center">Trạng thái</th>
              <th className="px-3 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-muted-foreground">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-muted-foreground">
                  Chưa có bảng lương nào
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.code}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.payCycle === "MONTHLY" ? "Hàng tháng" : row.payCycle}</td>
                  <td className="px-3 py-2">
                    {row.workDateFrom} - {row.workDateTo}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(row.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(row.paidAmount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(row.remainingAmount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center">{row.status}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPayrollId(row.id);
                        setOpenPay(true);
                      }}
                      disabled={Number(row.remainingAmount) <= 0}
                    >
                      Thanh toán
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div>
          Tổng: <b>{meta.total}</b> • Trang <b>{meta.page}</b>/
          <b>{meta.pages}</b>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
          >
            Sau
          </Button>
        </div>
      </div>

      <PayPayrollDialog
        payrollId={payrollId}
        open={openPay}
        onOpenChange={(v) => {
          setOpenPay(v);
          if (!v) setPayrollId(undefined);
        }}
      />
    </div>
  );
}
