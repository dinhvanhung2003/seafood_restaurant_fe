"use client";

import React, { useEffect, useState } from "react";
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
import { Trash2 } from "lucide-react";

// --- HÀM VALIDATE (GIỮ NGUYÊN) ---
const validateNumberInput = (
  val: string,
  config: { allowZero?: boolean; max?: number; required?: boolean } = {}
): { isValid: boolean; msg: string | null; value: number | "" } => {
  const { allowZero = true, max, required = false } = config;

  if (val === "" || val === undefined || val === null) {
    if (required) return { isValid: false, msg: "Bắt buộc", value: "" };
    return { isValid: true, msg: null, value: "" };
  }

  if (!/^-?\d*\.?\d*$/.test(val)) {
    return { isValid: false, msg: "Phải là số", value: val as any };
  }

  const n = Number(val);
  if (isNaN(n)) return { isValid: false, msg: "Lỗi số", value: val as any };

  if (n < 0) return { isValid: false, msg: "Không được âm", value: n };

  if (!allowZero && n === 0)
    return { isValid: false, msg: "Phải > 0", value: n };

  if (max !== undefined && n > max)
    return { isValid: false, msg: `Max ${max}`, value: n };

  return { isValid: true, msg: null, value: n };
};

export default function LineRow({
  l,
  onUpdate,
  onRemove,
  disabled = false,
  checkLot,
  receiptDate,
}: {
  l: Line;
  onUpdate: (patch: Partial<Line>) => void;
  onRemove: () => void;
  disabled?: boolean;
  checkLot?: (lot?: string, uom?: string) => boolean;
  receiptDate: string;
}) {
  const total = lineTotal(l);

  // State lỗi
  const [qtyErr, setQtyErr] = useState<string | null>(null);
  const [priceErr, setPriceErr] = useState<string | null>(null);
  const [discErr, setDiscErr] = useState<string | null>(null);
  const [lotErr, setLotErr] = useState<string | null>(null);
  const [expiryErr, setExpiryErr] = useState<string | null>(null);

  // Check trùng lô
  useEffect(() => {
    if (!checkLot) return;
    const isDup = checkLot(l.lotNumber, l.receivedUomCode);
    setLotErr(isDup ? "Trùng lô" : null);
  }, [l.receivedUomCode, l.lotNumber, checkLot]);

  // --- Handlers ---
  const handleQtyChange = (val: string) => {
    const res = validateNumberInput(val, { allowZero: false, required: true });
    setQtyErr(res.msg);
    onUpdate({ quantity: res.value });
  };

  const handlePriceChange = (val: string) => {
    const res = validateNumberInput(val, { allowZero: true, required: true });
    setPriceErr(res.msg);
    onUpdate({ unitPrice: res.value });
  };

  const handleDiscountValChange = (val: string) => {
    const isPercent = l.discountType === "PERCENT";
    const res = validateNumberInput(val, {
      allowZero: true,
      required: true,
      max: isPercent ? 100 : undefined,
    });
    setDiscErr(res.msg);
    onUpdate({ discountValue: res.value });
  };

  const handleDiscountTypeChange = (type: DiscountType) => {
    onUpdate({ discountType: type });
    const valStr = String(l.discountValue);
    const res = validateNumberInput(valStr, {
      allowZero: true,
      required: true,
      max: type === "PERCENT" ? 100 : undefined,
    });
    setDiscErr(res.msg);
  };
  const handleExpiryChange = (val: string) => {
    onUpdate({ expiryDate: val });

    if (!val) {
      setExpiryErr("Bắt buộc");
      return;
    }
    const exp = new Date(val);
    const receipt = new Date(receiptDate);
    exp.setHours(0, 0, 0, 0);
    receipt.setHours(0, 0, 0, 0);

    if (exp <= receipt) {
      setExpiryErr("HSD phải sau ngày nhập");
    } else {
      setExpiryErr(null);
    }
  };
  useEffect(() => {
    if (l.expiryDate) {
      handleExpiryChange(l.expiryDate);
    }
  }, [receiptDate]);
  // Helper render Input
  const renderInputWithErr = (
    value: string | number,
    onChange: (val: string) => void,
    error: string | null,
    widthClass: string,
    placeholder = "0"
  ) => (
    <div className="flex flex-col">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`h-9 ${widthClass} ${
          error ? "border-red-500 focus-visible:ring-red-500 bg-red-50" : ""
        }`}
        placeholder={placeholder}
      />
      {error && (
        <span className="text-[10px] text-red-600 font-medium mt-1 animate-in fade-in slide-in-from-top-1 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );

  return (
    <tr className="border-t align-top hover:bg-muted/20">
      <Td className="py-3 font-medium min-w-[150px] align-middle">
        {l.itemName}
      </Td>

      {/* Số lượng */}
      <Td className="py-2">
        {renderInputWithErr(l.quantity, handleQtyChange, qtyErr, "w-[80px]")}
      </Td>

      {/* Đơn giá */}
      <Td className="py-2">
        {renderInputWithErr(
          l.unitPrice,
          handlePriceChange,
          priceErr,
          "w-[120px]"
        )}
      </Td>

      {/* Chiết khấu */}
      <Td className="py-2">
        <div className="flex gap-2 items-start">
          <Select
            value={l.discountType}
            onValueChange={(v) => handleDiscountTypeChange(v as DiscountType)}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AMOUNT">VNĐ</SelectItem>
              <SelectItem value="PERCENT">%</SelectItem>
            </SelectContent>
          </Select>
          {renderInputWithErr(
            l.discountValue,
            handleDiscountValChange,
            discErr,
            "w-[100px]"
          )}
        </div>
      </Td>

      {/* Đơn vị nhận */}
      <Td className="py-2 pr-2">
        <div className="w-[160px]">
          <UomSelect
            itemId={l.itemId}
            value={l.receivedUomCode || undefined}
            onChange={(val) => onUpdate({ receivedUomCode: val })}
            disabled={disabled}
          />
        </div>
      </Td>

      {/* Số lô */}
      <Td className="py-2">
        <div className="flex flex-col w-[140px]">
          <Input
            value={l.lotNumber ?? ""}
            onChange={(e) => onUpdate({ lotNumber: e.target.value })}
            className={`h-9 ${
              lotErr ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            disabled={disabled}
            placeholder="Số lô..."
          />
          {lotErr && (
            <span className="text-[10px] text-red-600 mt-1">{lotErr}</span>
          )}
        </div>
      </Td>

      {/* Cột HSD */}
      <Td className="py-2">
        <div className="flex flex-col">
          <Input
            type="date"
            value={l.expiryDate ?? ""}
            onChange={(e) => handleExpiryChange(e.target.value)}
            min={receiptDate}
            className={`h-9 w-[150px] ${
              expiryErr
                ? "border-red-500 focus-visible:ring-red-500 bg-red-50"
                : ""
            }`}
            disabled={disabled}
          />
          {expiryErr && (
            <span className="text-[10px] text-red-600 font-medium mt-1 animate-in fade-in slide-in-from-top-1">
              {expiryErr}
            </span>
          )}
        </div>
      </Td>

      {/* --- MỚI THÊM: GHI CHÚ --- */}
      <Td className="py-2">
        <Input
          value={l.note ?? ""}
          onChange={(e) => onUpdate({ note: e.target.value })}
          className="h-9 w-[150px]"
          disabled={disabled}
          placeholder="Ghi chú..."
        />
      </Td>

      {/* Thành tiền */}
      <Td className="text-right align-middle font-medium py-3 min-w-[100px]">
        {currency(total)}
      </Td>

      {/* Nút Xoá */}
      <Td className="align-middle text-center py-3 pl-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
          disabled={disabled}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </Td>
    </tr>
  );
}
