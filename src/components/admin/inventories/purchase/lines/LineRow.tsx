"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DiscountType, Line } from "@/types/types";
import { Td } from "@/helper/purchase";
import { currency, lineTotal } from "@/utils/purchase";

export default function LineRow({
  l,
  onUpdate,
  onRemove,
}: {
  l: Line;
  onUpdate: (patch: Partial<Line>) => void;
  onRemove: () => void;
}) {
  const total = lineTotal(l);
  return (
    <tr className="border-t">
      <Td className="align-middle font-medium">{l.itemName}</Td>

      {/* SL */}
      <Td>
        <Input
          type="number"
          value={l.quantity === "" ? "" : String(l.quantity)}
          onChange={(e) => onUpdate({ quantity: e.target.value === "" ? "" : Number(e.target.value) })}
          className="h-9 w-[84px]"
        />
      </Td>

      {/* Đơn giá */}
      <Td>
        <Input
          type="number"
          value={l.unitPrice === "" ? "" : String(l.unitPrice)}
          onChange={(e) => onUpdate({ unitPrice: e.target.value === "" ? "" : Number(e.target.value) })}
          className="h-9 w-[136px]"
        />
      </Td>

      {/* CK dòng */}
      <Td>
        <div className="flex gap-2 items-center">
          <Select value={l.discountType} onValueChange={(v) => onUpdate({ discountType: v as DiscountType })}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AMOUNT">Số tiền</SelectItem>
              <SelectItem value="PERCENT">% </SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={l.discountValue === "" ? "" : String(l.discountValue)}
            onChange={(e) => onUpdate({ discountValue: e.target.value === "" ? "" : Number(e.target.value) })}
            className="h-9 w-[110px]"
          />
        </div>
      </Td>

      {/* Đơn vị nhận (mã) */}
      <Td>
        <Input
          value={l.receivedUomCode}
          onChange={(e) => onUpdate({ receivedUomCode: e.target.value })}
          placeholder="VD: KG/BOX…"
          className="h-9 w-[126px]"
        />
      </Td>

      {/* Số lô */}
      <Td>
        <Input value={l.lotNumber ?? ""} onChange={(e) => onUpdate({ lotNumber: e.target.value })} className="h-9 w-[136px]" />
      </Td>

      {/* HSD */}
      <Td>
        <Input type="date" value={l.expiryDate ?? ""} onChange={(e) => onUpdate({ expiryDate: e.target.value })} className="h-9 w-[166px]" />
      </Td>

      {/* Ghi chú */}
      <Td>
        <Input value={l.note ?? ""} onChange={(e) => onUpdate({ note: e.target.value })} className="h-9 w-[156px]" />
      </Td>

      {/* Thành tiền */}
      <Td className="text-right align-middle">{currency(total)}</Td>

      {/* Xoá */}
      <Td className="align-middle">
        <Button variant="outline" size="sm" onClick={onRemove} className="h-9">
          Xoá
        </Button>
      </Td>
    </tr>
  );
}
