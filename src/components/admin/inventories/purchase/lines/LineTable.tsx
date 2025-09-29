// src/components/admin/inventories/purchase/lines/LineTable.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Th, Td } from "@/helper/purchase";
import type { Line } from "@/types/types";
import LineRow from "./LineRow";

export default function LinesTable({
  lines,
  onUpdateLine,
  onRemoveLine,
  disabled = false,
  isLotDuplicate, // <-- NEW
}: {
  lines: Line[];
  onUpdateLine: (tmpId: string, patch: Partial<Line>) => void;
  onRemoveLine: (tmpId: string) => void;
  disabled?: boolean;
  // NEW: hàm kiểm tra trùng lô (cùng SP + ĐVT)
  isLotDuplicate?: (tmpId: string, lot?: string, uom?: string) => boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách hàng trong phiếu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <table className="min-w-[1220px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th className="w-[220px]">Tên hàng</Th>
                <Th className="w-[88px]">SL</Th>
                <Th className="w-[140px]">Đơn giá</Th>
                <Th className="w-[240px]">CK dòng</Th>
                <Th className="w-[160px]">Đơn vị nhận (mã)</Th>
                <Th className="w-[140px]">Số lô</Th>
                <Th className="w-[170px]">HSD</Th>
                <Th className="w-[160px]">Ghi chú</Th>
                <Th className="w-[140px] text-right">Thành tiền</Th>
                <Th className="w-[72px]"></Th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <LineRow
                  key={l.tmpId}
                  l={l}
                  onUpdate={(patch) => onUpdateLine(l.tmpId, patch)}
                  onRemove={() => onRemoveLine(l.tmpId)}
                  disabled={disabled}
                  // pass xuống LineRow
                  checkLot={(lot?: string, uom?: string) =>
                    isLotDuplicate?.(l.tmpId, lot, uom) ?? false
                  }
                />
              ))}

              {lines.length === 0 && (
                <tr>
                  <Td colSpan={10} className="py-8 text-center text-slate-500">
                    Chưa có dòng hàng. Thêm ở panel <b>Nguyên liệu</b> bên trái.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
