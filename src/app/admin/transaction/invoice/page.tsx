// app/admin/invoices/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useInvoices, useInvoiceDetail } from '@/hooks/admin/useInvoice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
type InvStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'ALL';
const currency = (n: number) => n.toLocaleString('vi-VN');

export default function InvoiceListPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<InvStatus>('ALL');// UNPAID | PARTIAL | PAID
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetching } = useInvoices({ q, status: status || undefined, page: 1, limit: 20 });
  const detail = useInvoiceDetail(selectedId);

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Hóa đơn</h1>

      <div className="flex gap-2">
        <Input placeholder="Tìm mã HĐ / KH / Bàn…" value={q} onChange={(e) => setQ(e.target.value)} className="w-[320px]" />
       <Select value={status} onValueChange={(v) => setStatus(v as InvStatus)}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Trạng thái" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ALL">Tất cả</SelectItem>
    <SelectItem value="UNPAID">Chưa trả</SelectItem>
    <SelectItem value="PARTIAL">Trả một phần</SelectItem>
    <SelectItem value="PAID">Đã trả</SelectItem>
  </SelectContent>
</Select>

<Button variant="outline" onClick={() => setStatus('ALL')}>Xóa lọc</Button>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-[960px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Mã HĐ</Th>
              <Th>Thời gian</Th>
              <Th>Bàn</Th>
              <Th>Khách</Th>
              <Th className="text-right">Tổng tiền</Th>
              <Th className="text-right">Đã thu (TM)</Th>
              <Th className="text-right">Đã thu (NH)</Th>
              <Th className="text-right">Còn lại</Th>
            </tr>
          </thead>
          <tbody className={isFetching ? 'opacity-70' : ''}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <Td><Skeleton className="h-4 w-32" /></Td>
                  <Td><Skeleton className="h-4 w-40" /></Td>
                  <Td><Skeleton className="h-4 w-20" /></Td>
                  <Td><Skeleton className="h-4 w-40" /></Td>
                  <Td className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></Td>
                  <Td className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></Td>
                  <Td className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></Td>
                  <Td className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></Td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><Td colSpan={8} className="py-8 text-center text-slate-500">Không có dữ liệu</Td></tr>
            ) : items.map(inv => (
              <tr key={inv.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedId(inv.id)}>
                <Td className="font-medium">{inv.invoiceNumber}</Td>
                <Td>{new Date(inv.createdAt).toLocaleString()}</Td>
                <Td>{inv.table?.name ?? '-'}</Td>
                <Td>{inv.customer?.name ?? 'Khách lẻ'}</Td>
                <Td className="text-right">{currency(inv.totalAmount)}</Td>
                <Td className="text-right">{currency(inv.paidCash)}</Td>
                <Td className="text-right">{currency(inv.paidBank)}</Td>
                <Td className="text-right">{currency(inv.remaining)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal chi tiết */}
      <Dialog open={!!selectedId} onOpenChange={(v) => !v && setSelectedId(undefined)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>Chi tiết hóa đơn</DialogTitle></DialogHeader>

          {detail.isLoading || !detail.data ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-60" />
              <Skeleton className="h-5 w-80" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <Info label="Mã HĐ" value={detail.data.invoiceNumber} />
                <Info label="Thời gian" value={new Date(detail.data.createdAt).toLocaleString()} />
                <Info label="Bàn" value={detail.data.table?.name ?? '-'} />
                <Info label="Khách" value={detail.data.customer?.name ?? 'Khách lẻ'} />
                <Info label="Số khách" value={detail.data.guestCount ?? '-'} />
                <Info label="Trạng thái" value={detail.data.status} />
              </div>

              <div className="mt-3 rounded-lg border overflow-x-auto">
                <table className="min-w-[720px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Tên hàng</Th>
                      <Th className="text-right">SL</Th>
                      <Th className="text-right">Đơn giá</Th>
                      <Th className="text-right">Thành tiền</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.data.items.map(row => (
                      <tr key={row.id} className="border-t">
                        <Td>{row.name}</Td>
                        <Td className="text-right">{row.qty}</Td>
                        <Td className="text-right">{currency(row.unitPrice)}</Td>
                        <Td className="text-right">{currency(row.lineTotal)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-4 gap-3 text-sm">
                <Info label="Tổng tiền hàng" value={currency(detail.data.totalAmount)} />
                <Info label="Đã thu (TM)" value={currency(detail.data.paidCash)} />
                <Info label="Đã thu (NH)" value={currency(detail.data.paidBank)} />
                <Info label="Khách cần trả" value={currency(detail.data.remaining)} />
              </div>

              {/* Lịch sử thanh toán */}
              <div className="mt-3">
                <div className="font-medium mb-1">Lịch sử thanh toán</div>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="min-w-[720px] text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <Th>Phương thức</Th>
                        <Th>Mã tham chiếu</Th>
                        <Th>Trạng thái</Th>
                        <Th className="text-right">Số tiền</Th>
                        <Th>Thời gian</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.data.payments.map(p => (
                        <tr key={p.id} className="border-t">
                          <Td>{p.method === 'CASH' ? 'Tiền mặt' : 'VNPay'}</Td>
                          <Td>{p.txnRef ?? '-'}</Td>
                          <Td>{p.status}</Td>
                          <Td className="text-right">{currency(p.amount)}</Td>
                          <Td>{new Date(p.createdAt).toLocaleString()}</Td>
                        </tr>
                      ))}
                      {detail.data.payments.length === 0 && (
                        <tr><Td colSpan={5} className="py-4 text-center text-slate-500">Chưa có thanh toán</Td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Th({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={['px-3 py-2 text-left font-medium', className].filter(Boolean).join(' ')}>{children}</th>;
}
function Td({ children, className, colSpan }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return <td className={['px-3 py-2', className].filter(Boolean).join(' ')} colSpan={colSpan}>{children}</td>;
}
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}
