"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiscountType, Line } from "@/types/types";
import { Td } from "@/helper/purchase";
import { currency, lineTotal } from "@/utils/purchase";
import UomSelect from "@/app/admin/inventories/purchase/line/UomSelect";
import { useEffect, useState } from "react";
export default function LineRow({
  l,
  onUpdate,
  onRemove,
  disabled = false,
  checkLot, // NEW
}: {
  l: Line;
  onUpdate: (patch: Partial<Line>) => void;
  onRemove: () => void;
  disabled?: boolean;
  checkLot?: (lot?: string, uom?: string) => boolean; // NEW
}) {
  const total = lineTotal(l);
  const [lotErr, setLotErr] = useState<string | null>(null);
  useEffect(() => {
    if (!checkLot) return;
    setLotErr(
      checkLot(l.lotNumber, l.receivedUomCode)
        ? "Trùng lô (cùng SP + ĐVT) với dòng khác."
        : null
    );
  }, [l.receivedUomCode, l.lotNumber, checkLot]);
  return (
    <tr className="border-t">
      <Td className="align-middle font-medium">{l.itemName}</Td>

      {/* SL */}
      <Td>
        <Input
          type="number"
          value={l.quantity === "" ? "" : String(l.quantity)}
          onChange={(e) =>
            onUpdate({
              quantity: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
          className="h-9 w-[84px]"
          disabled={disabled}
        />
      </Td>

      {/* Đơn giá */}
      <Td>
        <Input
          type="number"
          value={l.unitPrice === "" ? "" : String(l.unitPrice)}
          onChange={(e) =>
            onUpdate({
              unitPrice: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
          className="h-9 w-[136px]"
          disabled={disabled}
        />
      </Td>

      {/* CK dòng */}
      <Td>
        <div className="flex gap-2 items-center">
          <Select
            value={l.discountType}
            onValueChange={(v) => onUpdate({ discountType: v as DiscountType })}
            disabled={disabled}
          >
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
            onChange={(e) =>
              onUpdate({
                discountValue:
                  e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            className="h-9 w-[110px]"
            disabled={disabled}
          />
        </div>
      </Td>

      {/* Đơn vị nhận */}
      <Td className="pr-2">
        <div className="w-[180px]">
          <UomSelect
            itemId={l.itemId}
            value={l.receivedUomCode || undefined}
            onChange={(val) => {
              onUpdate({ receivedUomCode: val });
              // cập nhật cảnh báo trùng lô (nếu bạn đang dùng checkLot)
              if (checkLot) {
                setLotErr(
                  checkLot(l.lotNumber, val)
                    ? "Trùng lô (cùng SP + ĐVT) với dòng khác."
                    : null
                );
              }
            }}
            disabled={disabled}
          />
          {lotErr && <div className="mt-1 text-xs text-red-500">{lotErr}</div>}
        </div>
      </Td>

      {/* Số lô */}
      <Td>
        <div className="w-[145px]">
          <Input
            value={l.lotNumber ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              onUpdate({ lotNumber: val });
              if (checkLot) {
                setLotErr(
                  checkLot(val, l.receivedUomCode)
                    ? "Trùng lô (cùng SP + ĐVT) với dòng khác."
                    : null
                );
              }
            }}
            className={`h-9 w-full ${
              lotErr ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            disabled={disabled}
          />
          {lotErr && <div className="mt-1 text-xs text-red-500">{lotErr}</div>}
        </div>
      </Td>

      {/* HSD */}
      <Td>
        <Input
          type="date"
          value={l.expiryDate ?? ""}
          onChange={(e) => onUpdate({ expiryDate: e.target.value })}
          className="h-9 w-[166px]"
          disabled={disabled}
        />
      </Td>

      {/* Ghi chú */}
      <Td>
        <Input
          value={l.note ?? ""}
          onChange={(e) => onUpdate({ note: e.target.value })}
          className="h-9 w-[156px]"
          disabled={disabled}
        />
      </Td>

      {/* Thành tiền */}
      <Td className="text-right align-middle">{currency(total)}</Td>

      {/* Xoá */}
      <Td className="align-middle">
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="h-9"
          disabled={disabled}
        >
          Xoá
        </Button>
      </Td>
    </tr>
  );
}
