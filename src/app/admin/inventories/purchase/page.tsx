// src/app/admin/purchase/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { usePRList } from "@/hooks/admin/usePurchase";
import { Button } from "@/components/ui/button";
import PurchaseReceiptDetailModal from "@/components/admin/inventories/purchase/modal/PurchaseReceiptDetailModal";

export default function PurchaseListPage() {
  const [page, setPage] = useState(1);
  const { data } = usePRList({ page, limit: 10 });

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xl font-semibold">Phiếu nhập hàng</div>
        <Link href="/admin/inventories/purchase/new"><Button>+ Nhập hàng</Button></Link>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Mã phiếu</th>
              <th className="px-3 py-2 text-left">Thời gian</th>
              <th className="px-3 py-2 text-left">Nhà cung cấp</th>
              <th className="px-3 py-2 text-right">Trạng thái</th>
              {/* <th className="px-3 py-2 text-right">Tổng tiền</th> */}
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(data?.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.code}</td>
                <td className="px-3 py-2">{r.receiptDate}</td>
                <td className="px-3 py-2">{r.supplier?.name}</td>
                <td className="px-3 py-2 text-right">{r.status}</td>
                {/* <td className="px-3 py-2 text-right">
                  {Number(r.grandTotal || 0).toLocaleString()}
                </td> */}
                <td className="px-3 py-2 text-right">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => { setSelectedId(r.id); setOpen(true); }}
                  >
                    Xem
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" onClick={()=>setPage(p=>Math.max(1,p-1))}>Trước</Button>
        <Button variant="outline" onClick={()=>setPage(p=>p+1)}>Sau</Button>
      </div>

      <PurchaseReceiptDetailModal
        open={open}
        onOpenChange={setOpen}
        id={selectedId}
      />
    </div>
  );
}
