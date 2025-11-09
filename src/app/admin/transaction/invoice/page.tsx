// app/admin/invoices/page.tsx
'use client';

import { useState } from 'react';
import { useInvoices, useInvoiceDetail, type InvoiceStatus } from '@/hooks/admin/useInvoice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import InvoiceDetailDialog from '@/components/admin/transaction/invoice/modal/InvoiceDetailModal';

const STATUS_OPTIONS: InvoiceStatus[] = ['UNPAID', 'PARTIAL', 'PAID'];
const currency = (n: number | string) => Number(n ?? 0).toLocaleString('vi-VN');

export default function InvoiceListPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('UNPAID');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetching } = useInvoices({ q, status, page: 1, limit: 20 });
  const detail = useInvoiceDetail(selectedId);

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Hóa đơn</h1>

      <div className="flex gap-2">
        <Input
          placeholder="Tìm mã HĐ / KH / Bàn…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-[320px]"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'UNPAID' ? 'Chưa thanh toán' : s === 'PARTIAL' ? 'Thanh toán một phần' : 'Đã thanh toán'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => { setQ(''); setStatus('UNPAID'); }}>
          Xóa lọc
        </Button>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-[1040px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Mã HĐ</Th>
              <Th>Thời gian</Th>
              <Th>Bàn</Th>
              <Th>Khách</Th>
              <Th className="text-right">Tổng niêm yết</Th>
              <Th className="text-right">Giảm</Th>
              <Th className="text-right">Cần thu</Th>
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
                  <Td className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></Td>
                  <Td className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></Td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <Td colSpan={10} className="py-8 text-center text-slate-500">Không có dữ liệu</Td>
              </tr>
            ) : (
              items.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedId(inv.id)}>
                  <Td className="font-medium">{inv.invoiceNumber}</Td>
                  <Td>{new Date(inv.createdAt).toLocaleString('vi-VN')}</Td>
                  <Td>{inv.table?.name ?? '-'}</Td>
                  <Td>{inv.customer?.name ?? 'Khách lẻ'}</Td>
                  <Td className="text-right">{currency(inv.totalAmount)}</Td>
                  <Td className="text-right">{currency(inv.discountTotal)}</Td>
                  <Td className="text-right font-medium">{currency(inv.finalAmount)}</Td>
                  <Td className="text-right">{currency(inv.paidCash)}</Td>
                  <Td className="text-right">{currency(inv.paidBank)}</Td>
                  <Td className="text-right">{currency(inv.remaining)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InvoiceDetailDialog
        open={!!selectedId}
        onOpenChange={(v) => !v && setSelectedId(undefined)}
        invoiceId={selectedId}
      />
    </div>
  );
}

function Th({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={['px-3 py-2 text-left font-medium', className].join(' ')}>{children}</th>;
}
function Td({ children, className, colSpan }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return <td className={['px-3 py-2', className].join(' ')} colSpan={colSpan}>{children}</td>;
}
